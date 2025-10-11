import { getCloudflareContext } from "@opennextjs/cloudflare";
import { applyRateLimit } from "@/lib/rate-limit";

const DEFAULT_ALLOWED_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
];

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type UploadResult =
    | {
          success: true;
          object: {
              key: string;
              url?: string;
              contentType: string;
              size: number;
              scan: {
                  status: "skipped" | "passed";
                  auditId?: string;
              };
          };
      }
    | {
          success: false;
          error: string;
      };

export interface UploadRateLimitOptions {
    request: Request;
    identifier: string;
    uniqueToken?: string | null;
    message?: string;
}

export interface UploadConstraints {
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
    requireContentScan?: boolean;
    scanFile?: (options: {
        file: File;
    }) => Promise<{ ok: boolean; error?: string; auditId?: string }>;
    rateLimit?: UploadRateLimitOptions;
}

function normalizeFolder(folder: string | undefined) {
    // 线性时间去除首尾斜杠，避免正则与回溯
    const raw = (folder ?? "uploads").trim();
    let start = 0;
    let end = raw.length - 1;
    // 去掉前导 '/'
    while (start <= end && raw.charCodeAt(start) === 47 /* '/' */) start++;
    // 去掉尾随 '/'
    while (end >= start && raw.charCodeAt(end) === 47 /* '/' */) end--;
    const normalized = raw.slice(start, end + 1);
    return normalized || "uploads";
}

function createRandomId() {
    if (
        typeof globalThis.crypto !== "undefined" &&
        typeof (globalThis.crypto as Crypto).randomUUID === "function"
    ) {
        return (globalThis.crypto as Crypto).randomUUID();
    }
    if (
        typeof globalThis.crypto !== "undefined" &&
        typeof (globalThis.crypto as Crypto).getRandomValues === "function"
    ) {
        const bytes = new Uint8Array(16);
        (globalThis.crypto as Crypto).getRandomValues(bytes);
        let out = "";
        for (let i = 0; i < bytes.length; i++) {
            out += bytes[i].toString(16).padStart(2, "0");
        }
        return out;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto =
            require("node:crypto") as typeof import("node:crypto");
        return nodeCrypto.randomBytes(16).toString("hex");
    } catch {}
    // 最后兜底：使用时间戳，避免依赖非安全随机
    return `${Date.now()}-${performance?.now?.() ?? 0}`;
}

function sanitizeExtension(filename: string) {
    const ext = filename.split(".").pop();
    if (!ext) return "";
    const cleaned = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned ? `.${cleaned}` : "";
}

function isMimeAllowed(mime: string, allowed: string[]) {
    if (!allowed.length) {
        return true;
    }

    return allowed.some((allowedMime) => {
        if (allowedMime.endsWith("/*")) {
            const prefix = allowedMime.slice(0, -1);
            return mime.startsWith(prefix);
        }
        return mime === allowedMime;
    });
}

function formatMaxSize(bytes: number) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shouldForceAttachment(mime: string) {
    // 文档类内容：强制下载，避免同域内联带来的潜在 XSS/嗅探风险
    if (mime === "application/pdf") return true;
    if (mime.startsWith("text/")) return true;
    return false;
}

export async function uploadToR2(
    file: File,
    folder: string = "uploads",
    constraints: UploadConstraints = {},
): Promise<UploadResult> {
    try {
        const allowedMimeTypes =
            constraints.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
        const maxSizeBytes =
            constraints.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
        const requireContentScan = constraints.requireContentScan ?? false;
        const scanFile = constraints.scanFile;
        const rateLimit = constraints.rateLimit;

        if (file.size > maxSizeBytes) {
            return {
                success: false,
                error: `File size exceeds limit (${formatMaxSize(maxSizeBytes)})`,
            };
        }

        const detectedMime = file.type || "application/octet-stream";
        if (!isMimeAllowed(detectedMime, allowedMimeTypes)) {
            return {
                success: false,
                error: "File type is not permitted",
            };
        }

        if (rateLimit) {
            const rateLimitOutcome = await applyRateLimit({
                request: rateLimit.request,
                identifier: rateLimit.identifier,
                uniqueToken: rateLimit.uniqueToken ?? null,
                message: rateLimit.message ?? "Upload rate limit exceeded",
            });

            if (!rateLimitOutcome.ok) {
                return {
                    success: false,
                    error: rateLimit.message ?? "Upload rate limit exceeded",
                };
            }
        }

        let scanStatus: "skipped" | "passed" = "skipped";
        let auditId: string | undefined;

        if (requireContentScan || typeof scanFile === "function") {
            if (typeof scanFile !== "function") {
                return {
                    success: false,
                    error: "Content scanning is required but no scanner was provided",
                };
            }
            try {
                const scanResult = await scanFile({ file });
                if (!scanResult?.ok) {
                    return {
                        success: false,
                        error:
                            scanResult?.error ??
                            "File content failed security scan",
                    };
                }
                scanStatus = "passed";
                auditId = scanResult.auditId;
            } catch (error) {
                console.error("R2 upload content scan error:", error);
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "File content failed security scan",
                };
            }
        }

        const { env } = await getCloudflareContext({ async: true });

        const timestamp = Date.now();
        const randomId = createRandomId();
        const extension = sanitizeExtension(file.name) || ".bin";
        const normalizedFolder = normalizeFolder(folder);
        const key = `${normalizedFolder}/${timestamp}_${randomId}${extension}`;

        const arrayBuffer = await file.arrayBuffer();

        const result = await env.next_cf_app_bucket.put(key, arrayBuffer, {
            httpMetadata: {
                contentType: detectedMime,
                cacheControl: "public, max-age=31536000", // 1 year
                ...(shouldForceAttachment(detectedMime)
                    ? {
                          contentDisposition: `attachment; filename="${encodeURIComponent(
                              file.name,
                          )}"`,
                      }
                    : {}),
            },
            customMetadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
                size: file.size.toString(),
                scanStatus,
                ...(auditId ? { scanAuditId: auditId } : {}),
            },
        });

        if (!result) {
            return {
                success: false,
                error: "Upload failed",
            };
        }

        const publicDomain = env.CLOUDFLARE_R2_URL;
        const publicUrl = publicDomain
            ? `https://${publicDomain}/${key}`
            : undefined;

        return {
            success: true,
            object: {
                key,
                url: publicUrl,
                contentType: detectedMime,
                size: file.size,
                scan: {
                    status: scanStatus,
                    ...(auditId ? { auditId } : {}),
                },
            },
        };
    } catch (error) {
        console.error("R2 upload error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        };
    }
}

export async function getFromR2(key: string): Promise<R2Object | null> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        return env.next_cf_app_bucket.get(key);
    } catch (error) {
        console.error("Error getting data from R2", error);
        return null;
    }
}

export async function listR2Files() {}
