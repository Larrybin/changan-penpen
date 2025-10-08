import { getCloudflareContext } from "@opennextjs/cloudflare";

const DEFAULT_ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
];

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
}

export interface UploadConstraints {
    allowedMimeTypes?: string[];
    maxSizeBytes?: number;
}

function normalizeFolder(folder: string | undefined) {
    const normalized = (folder ?? "uploads").trim().replace(/^\/+|\/+$/g, "");
    return normalized || "uploads";
}

function createRandomId() {
    if (
        typeof globalThis.crypto !== "undefined" &&
        typeof globalThis.crypto.randomUUID === "function"
    ) {
        return globalThis.crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 15);
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
            },
            customMetadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
                size: file.size.toString(),
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
            url: publicUrl,
            key,
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
