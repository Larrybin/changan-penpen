import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromR2, type UploadResult, uploadToR2 } from "../r2";

function ensureSuccess(
    result: UploadResult,
): Extract<UploadResult, { success: true }> {
    if (!result.success) {
        throw new Error(
            `Expected success but received: ${result.error ?? "unknown"}`,
        );
    }
    return result;
}

function ensureFailure(
    result: UploadResult,
): Extract<UploadResult, { success: false }> {
    if (result.success) {
        throw new Error("Expected failure but received success result");
    }
    return result;
}

const getCloudflareContextMock = vi.hoisted(() => vi.fn());
const applyRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/lib/rate-limit", () => ({
    applyRateLimit: applyRateLimitMock,
}));

function createMockFile(name = "image.png", type = "image/png", size = 4) {
    return {
        name,
        type,
        size,
        arrayBuffer: vi
            .fn()
            .mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
    } as unknown as File;
}

describe("r2 utilities", () => {
    let restoreCrypto: (() => void) | undefined;

    beforeEach(() => {
        getCloudflareContextMock.mockReset();
        applyRateLimitMock.mockReset();
        applyRateLimitMock.mockResolvedValue({ ok: true, skipped: true });
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);

        const existingCrypto = globalThis.crypto as Crypto | undefined;
        if (existingCrypto) {
            vi.spyOn(existingCrypto, "randomUUID").mockReturnValue("mock-uuid");
            restoreCrypto = undefined;
        } else {
            const cryptoStub = {
                randomUUID: vi.fn().mockReturnValue("mock-uuid"),
            } as unknown as Crypto;
            Object.defineProperty(globalThis, "crypto", {
                value: cryptoStub,
                configurable: true,
                writable: true,
            });
            restoreCrypto = () => {
                Reflect.deleteProperty(globalThis, "crypto");
            };
        }
    });

    afterEach(() => {
        vi.restoreAllMocks();
        restoreCrypto?.();
    });

    it("uploads files to R2 and returns public metadata", async () => {
        const putMock = vi.fn().mockResolvedValue({ etag: "etag" });
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                CLOUDFLARE_R2_URL: "cdn.example.com",
                next_cf_app_bucket: { put: putMock },
            },
        });

        const file = createMockFile();
        const result = ensureSuccess(await uploadToR2(file, "media"));

        expect(result.object.key).toBe("media/1700000000000_mock-uuid.png");
        expect(result.object.url).toBe(
            "https://cdn.example.com/media/1700000000000_mock-uuid.png",
        );
        expect(result.object.contentType).toBe("image/png");
        expect(result.object.size).toBe(4);
        expect(result.object.scan).toEqual({ status: "skipped" });
        expect(putMock).toHaveBeenCalled();
        expect(file.arrayBuffer).toHaveBeenCalled();
    });

    it("supports newly allowed document mime types", async () => {
        const putMock = vi.fn().mockResolvedValue({ etag: "etag" });
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                CLOUDFLARE_R2_URL: "cdn.example.com",
                next_cf_app_bucket: { put: putMock },
            },
        });

        const file = createMockFile("report.pdf", "application/pdf", 1024);
        const result = ensureSuccess(await uploadToR2(file, "docs"));

        expect(result.object.key).toBe("docs/1700000000000_mock-uuid.pdf");
        expect(result.object.scan.status).toBe("skipped");
        expect(putMock).toHaveBeenCalled();
    });

    it("returns failure result when upload returns null", async () => {
        const putMock = vi.fn().mockResolvedValue(null);
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                CLOUDFLARE_R2_URL: "cdn.example.com",
                next_cf_app_bucket: { put: putMock },
            },
        });

        const result = ensureFailure(
            await uploadToR2(createMockFile(), "files"),
        );
        expect(result).toEqual({ success: false, error: "Upload failed" });
    });

    it("rejects files exceeding the size limit", async () => {
        const largeFile = createMockFile(
            "large.png",
            "image/png",
            12 * 1024 * 1024,
        );

        const result = ensureFailure(await uploadToR2(largeFile, "media"));
        expect(result).toEqual({
            success: false,
            error: "File size exceeds limit (10.0 MB)",
        });
        expect(getCloudflareContextMock).not.toHaveBeenCalled();
        expect(largeFile.arrayBuffer).not.toHaveBeenCalled();
    });

    it("rejects files with disallowed mime types", async () => {
        const executableFile = createMockFile(
            "payload.exe",
            "application/x-msdownload",
        );

        const result = await uploadToR2(executableFile, "uploads");
        expect(result).toEqual({
            success: false,
            error: "File type is not permitted",
        });
        expect(getCloudflareContextMock).not.toHaveBeenCalled();
    });

    it("fails when content scanning is required but no scanner provided", async () => {
        const file = createMockFile();
        const result = ensureFailure(
            await uploadToR2(file, "media", {
                requireContentScan: true,
            }),
        );

        expect(result).toEqual({
            success: false,
            error: "Content scanning is required but no scanner was provided",
        });
        expect(getCloudflareContextMock).not.toHaveBeenCalled();
    });

    it("rejects uploads when the content scanner flags an issue", async () => {
        const file = createMockFile();
        const scanFile = vi.fn().mockResolvedValue({
            ok: false,
            error: "malware detected",
        });

        const result = ensureFailure(
            await uploadToR2(file, "media", {
                requireContentScan: true,
                scanFile,
            }),
        );

        expect(scanFile).toHaveBeenCalledWith({ file });
        expect(result).toEqual({ success: false, error: "malware detected" });
        expect(getCloudflareContextMock).not.toHaveBeenCalled();
    });

    it("enforces rate limiting when configured", async () => {
        applyRateLimitMock.mockResolvedValueOnce({
            ok: false,
            response: new Response(
                JSON.stringify({ success: false, error: "Too many uploads" }),
                { status: 429 },
            ),
        });

        const file = createMockFile();
        const result = ensureFailure(
            await uploadToR2(file, "media", {
                rateLimit: {
                    request: new Request("https://example.com/upload"),
                    identifier: "upload",
                    message: "Too many uploads",
                },
            }),
        );

        expect(applyRateLimitMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ success: false, error: "Too many uploads" });
        expect(getCloudflareContextMock).not.toHaveBeenCalled();
    });

    it("handles upload errors gracefully", async () => {
        getCloudflareContextMock.mockRejectedValueOnce(
            new Error("unavailable"),
        );

        const result = ensureFailure(
            await uploadToR2(createMockFile(), "files"),
        );
        expect(result.error).toBe("unavailable");
    });

    it("runs custom content scanner before uploading", async () => {
        const putMock = vi.fn().mockResolvedValue({ etag: "etag" });
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                CLOUDFLARE_R2_URL: "cdn.example.com",
                next_cf_app_bucket: { put: putMock },
            },
        });
        const scanFile = vi.fn().mockResolvedValue({
            ok: true,
            auditId: "audit-1",
        });

        const file = createMockFile("diagram.svg", "image/svg+xml", 4096);
        const result = ensureSuccess(
            await uploadToR2(file, "audio", {
                scanFile,
            }),
        );

        expect(scanFile).toHaveBeenCalledWith({ file });
        expect(result.object.key).toBe("audio/1700000000000_mock-uuid.svg");
        expect(result.object.scan).toEqual({
            status: "passed",
            auditId: "audit-1",
        });
        expect(putMock).toHaveBeenCalled();
    });

    it("fetches objects from R2", async () => {
        const getMock = vi.fn().mockResolvedValue({ key: "value" });
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                next_cf_app_bucket: { get: getMock },
            },
        });

        const object = await getFromR2("media/file.png");
        expect(object).toEqual({ key: "value" });
        expect(getMock).toHaveBeenCalledWith("media/file.png");
    });

    it("returns null when retrieving objects fails", async () => {
        getCloudflareContextMock.mockRejectedValueOnce(new Error("boom"));

        const object = await getFromR2("missing");
        expect(object).toBeNull();
    });
});
