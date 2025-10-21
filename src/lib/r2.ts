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
const DEFAULT_R2_CACHE_TTL_SECONDS = 300;
const R2_CACHE_META_HEADER = "x-r2-metadata";
const R2_CACHE_PREFIX = "https://r2-cache.internal/";

export interface R2ObjectResult {
    body: ArrayBuffer;
    size: number;
    etag?: string;
    uploaded?: string;
    httpMetadata?: R2HTTPMetadata | null;
    customMetadata?: Record<string, string> | null;
}

export interface GetFromR2Options {
    cacheTtlSeconds?: number;
    bypassCache?: boolean;
}

type CachedR2Metadata = {
    size: number;
    etag?: string | null;
    uploaded?: string | null;
    httpMetadata?: R2HTTPMetadata | null;
    customMetadata?: Record<string, string> | null;
};

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

// 统一获取 R2 绑定的宽化类型，避免对全局 Env 声明顺序的敏感依赖
type R2BucketLike = {
    put: (key: string, value: unknown, options?: unknown) => Promise<unknown>;
    get: (key: string) => Promise<R2Object | null>;
    list: (options?: unknown) => Promise<unknown>;
};

function getR2Bucket(env: unknown): R2BucketLike {
    const rec = env as Record<string, unknown> | null | undefined;
    const bucket = rec
        ? (rec as Record<string, unknown>).next_cf_app_bucket
        : undefined;
    return bucket as unknown as R2BucketLike;
}

async function getCache(): Promise<Cache | null> {
    try {
        if (typeof caches === "undefined") {
            return null;
        }

        const cacheStorage = caches as CacheStorage;

        if ("default" in cacheStorage) {
            const defaultCache = (
                cacheStorage as CacheStorage & {
                    default?: Cache;
                }
            ).default;
            if (defaultCache) {
                return defaultCache;
            }
        }

        if (typeof cacheStorage.open === "function") {
            return await cacheStorage.open("r2-object-cache");
        }

        return null;
    } catch (error) {
        console.warn("R2 cache unavailable", error);
        return null;
    }
}

function buildCacheRequest(key: string): Request {
    return new Request(`${R2_CACHE_PREFIX}${encodeURIComponent(key)}`);
}

async function readCachedObject(
    cache: Cache,
    key: string,
): Promise<R2ObjectResult | null> {
    try {
        const request = buildCacheRequest(key);
        const cached = await cache.match(request);
        if (!cached) {
            return null;
        }

        const metaHeader = cached.headers.get(R2_CACHE_META_HEADER);
        if (!metaHeader) {
            return null;
        }

        const metadata = JSON.parse(metaHeader) as CachedR2Metadata;
        const body = await cached.arrayBuffer();
        return {
            body,
            size: metadata.size,
            etag: metadata.etag ?? undefined,
            uploaded: metadata.uploaded ?? undefined,
            httpMetadata: metadata.httpMetadata ?? undefined,
            customMetadata: metadata.customMetadata ?? undefined,
        } satisfies R2ObjectResult;
    } catch (error) {
        console.warn("Failed to read cached R2 object", error);
        return null;
    }
}

async function writeCachedObject(
    cache: Cache,
    key: string,
    object: R2ObjectBody,
    metadata: CachedR2Metadata,
    ttlSeconds: number,
    arrayBuffer: ArrayBuffer,
): Promise<void> {
    try {
        const response = new Response(arrayBuffer.slice(0), {
            headers: {
                "Cache-Control": `public, max-age=${Math.max(ttlSeconds, 0)}`,
                "Content-Type":
                    object.httpMetadata?.contentType ??
                    "application/octet-stream",
                [R2_CACHE_META_HEADER]: JSON.stringify(metadata),
            },
        });
        await cache.put(buildCacheRequest(key), response);
    } catch (error) {
        console.warn("Failed to cache R2 object", error);
    }
}

function normalizeFolder(folder: string | undefined) {
    const val = (folder ?? "uploads").trim();
    let start = 0;
    let end = val.length - 1;
    // 去掉前导 '/'
    while (start <= end && val.charCodeAt(start) === 47 /* '/' */) start++;
    // 去掉尾随 '/'
    while (end >= start && val.charCodeAt(end) === 47 /* '/' */) end--;
    const normalized = val.slice(start, end + 1);
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
    // 鏈€鍚庡厹搴曪細浣跨敤鏃堕棿鎴筹紝閬垮厤渚濊禆闈炲畨鍏ㄩ殢鏈?    return `${Date.now()}-${performance?.now?.() ?? 0}`;
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
    // 鏂囨。绫诲唴瀹癸細寮哄埗涓嬭浇锛岄伩鍏嶅悓鍩熷唴鑱斿甫鏉ョ殑娼滃湪 XSS/鍡呮帰椋庨櫓
    if (mime === "application/pdf") return true;
    if (mime.startsWith("text/")) return true;
    return false;
}

// -------------------- 灏忓瀷鍐呰仛甯姪鍑芥暟锛岄檷浣?uploadToR2 澶嶆潅搴?--------------------
function validateFileForUpload(
    file: File,
    allowedMimeTypes: string[],
    maxSizeBytes: number,
): { ok: true; detectedMime: string } | { ok: false; error: string } {
    if (file.size > maxSizeBytes) {
        return {
            ok: false,
            error: `File size exceeds limit (${formatMaxSize(maxSizeBytes)})`,
        };
    }
    const detectedMime = file.type || "application/octet-stream";
    if (!isMimeAllowed(detectedMime, allowedMimeTypes)) {
        return { ok: false, error: "File type is not permitted" };
    }
    return { ok: true, detectedMime };
}

async function enforceUploadRateLimit(
    rateLimit?: UploadRateLimitOptions,
): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!rateLimit) return { ok: true };
    const outcome = await applyRateLimit({
        request: rateLimit.request,
        identifier: rateLimit.identifier,
        uniqueToken: rateLimit.uniqueToken ?? null,
        message: rateLimit.message ?? "Upload rate limit exceeded",
    });
    if (!outcome.ok) {
        return {
            ok: false,
            error: rateLimit.message ?? "Upload rate limit exceeded",
        };
    }
    return { ok: true };
}

async function __maybeScanFile(
    file: File,
    requireContentScan: boolean,
    scanFile?: (options: {
        file: File;
    }) => Promise<{ ok: boolean; error?: string; auditId?: string }>,
): Promise<
    | { ok: true; scanStatus: "skipped" | "passed"; auditId?: string }
    | { ok: false; error: string }
> {
    if (!requireContentScan && typeof scanFile !== "function") {
        return { ok: true, scanStatus: "skipped" };
    }
    if (typeof scanFile !== "function") {
        return {
            ok: false,
            error: "Content scanning is required but no scanner was provided",
        };
    }
    try {
        const res = await scanFile({ file });
        if (!res?.ok) {
            return {
                ok: false,
                error: res?.error ?? "File content failed security scan",
            };
        }
        return { ok: true, scanStatus: "passed", auditId: res.auditId };
    } catch (error) {
        console.error("R2 upload content scan error:", error);
        const message =
            error instanceof Error
                ? error.message
                : "File content failed security scan";
        return { ok: false, error: message };
    }
}

function buildR2ObjectKey(filename: string, folder: string): string {
    const timestamp = Date.now();
    const randomId = createRandomId();
    const extension = sanitizeExtension(filename) || ".bin";
    const normalizedFolder = normalizeFolder(folder);
    return `${normalizedFolder}/${timestamp}_${randomId}${extension}`;
}

function buildHttpMetadataForUpload(mime: string, filename: string) {
    return {
        contentType: mime,
        cacheControl: "public, max-age=31536000", // 1 year
        ...(shouldForceAttachment(mime)
            ? {
                  contentDisposition: `attachment; filename="${encodeURIComponent(
                      filename,
                  )}"`,
              }
            : {}),
    } as const;
}

function buildCustomMetadataForUpload(
    file: File,
    scanStatus: "skipped" | "passed",
    auditId?: string,
) {
    return {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
        scanStatus,
        ...(auditId ? { scanAuditId: auditId } : {}),
    } as const;
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
        const _requireContentScan = constraints.requireContentScan ?? false;
        const _scanFile = constraints.scanFile;
        const rateLimit = constraints.rateLimit;

        // 1) 鍩虹鏍￠獙锛氬ぇ灏忎笌绫诲瀷
        const validate = validateFileForUpload(
            file,
            allowedMimeTypes,
            maxSizeBytes,
        );
        if (!validate.ok) return { success: false, error: validate.error };
        const detectedMime = validate.detectedMime;

        // 2) 棰戠巼闄愬埗锛堝彲閫夛級
        const rate = await enforceUploadRateLimit(rateLimit);
        if (!rate.ok) return { success: false, error: rate.error };

        // 3) 内容扫描（可选/必需）
        const scanOutcome = await __maybeScanFile(
            file,
            _requireContentScan,
            _scanFile,
        );
        if (!scanOutcome.ok)
            return { success: false, error: scanOutcome.error };
        const { scanStatus, auditId } = scanOutcome;

        const { env } = await getCloudflareContext({ async: true });

        const key = buildR2ObjectKey(file.name, folder);

        const arrayBuffer = await file.arrayBuffer();

        const bucket = getR2Bucket(env);
        const result = await bucket.put(key, arrayBuffer, {
            httpMetadata: buildHttpMetadataForUpload(detectedMime, file.name),
            customMetadata: buildCustomMetadataForUpload(
                file,
                scanStatus,
                auditId,
            ),
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

export async function getFromR2(
    key: string,
    options: GetFromR2Options = {},
): Promise<R2ObjectResult | null> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const bucket = getR2Bucket(env);
        const cacheTtl =
            options.cacheTtlSeconds ?? DEFAULT_R2_CACHE_TTL_SECONDS;
        const bypassCache = options.bypassCache === true || cacheTtl <= 0;
        const cache = bypassCache ? null : await getCache();

        if (cache) {
            const cached = await readCachedObject(cache, key);
            if (cached) {
                return cached;
            }
        }

        const object = (await bucket.get(key)) as R2ObjectBody | null;
        if (!object) {
            return null;
        }

        const metadata: CachedR2Metadata = {
            size: object.size,
            etag: object.etag ?? null,
            uploaded:
                typeof object.uploaded === "string"
                    ? object.uploaded
                    : (object.uploaded?.toISOString?.() ?? null),
            httpMetadata: object.httpMetadata ?? null,
            customMetadata: object.customMetadata ?? null,
        };

        const arrayBuffer = await object.arrayBuffer();

        if (cache) {
            await writeCachedObject(
                cache,
                key,
                object,
                metadata,
                cacheTtl,
                arrayBuffer,
            );
        }

        return {
            body: arrayBuffer,
            size: metadata.size,
            etag: metadata.etag ?? undefined,
            uploaded: metadata.uploaded ?? undefined,
            httpMetadata: metadata.httpMetadata ?? undefined,
            customMetadata: metadata.customMetadata ?? undefined,
        } satisfies R2ObjectResult;
    } catch (error) {
        console.error("Error getting data from R2", error);
        return null;
    }
}

export async function listR2Files(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
}): Promise<{ objects: R2Object[]; cursor?: string }> {
    const { env } = await getCloudflareContext({ async: true });
    const prefix = options?.prefix;
    const limit = options?.limit ?? 100;
    const cursor = options?.cursor;
    try {
        const bucket = getR2Bucket(env);
        const listResult = (await bucket.list({
            prefix,
            limit,
            cursor,
        })) as unknown as {
            objects?: R2Object[];
            truncated?: boolean;
            cursor?: string;
        };
        const truncated = Boolean(listResult.truncated);
        const objects: R2Object[] = listResult.objects ?? [];
        const nextCursor = truncated ? listResult.cursor : undefined;
        return { objects, cursor: nextCursor };
    } catch (error) {
        console.error("Error listing R2 files", error);
        return { objects: [], cursor: undefined };
    }
}
