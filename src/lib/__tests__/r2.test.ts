import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromR2, uploadToR2 } from "../r2";

const getCloudflareContextMock = vi.hoisted(() => vi.fn());
vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
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
        const result = await uploadToR2(file, "media");

        expect(result.success).toBe(true);
        expect(result.key).toBe("media/1700000000000_mock-uuid.png");
        expect(result.url).toBe(
            "https://cdn.example.com/media/1700000000000_mock-uuid.png",
        );
        expect(putMock).toHaveBeenCalled();
        expect(file.arrayBuffer).toHaveBeenCalled();
    });

    it("returns failure result when upload returns null", async () => {
        const putMock = vi.fn().mockResolvedValue(null);
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                CLOUDFLARE_R2_URL: "cdn.example.com",
                next_cf_app_bucket: { put: putMock },
            },
        });

        const result = await uploadToR2(createMockFile(), "files");
        expect(result).toEqual({ success: false, error: "Upload failed" });
    });

    it("rejects files exceeding the size limit", async () => {
        const largeFile = createMockFile(
            "large.png",
            "image/png",
            12 * 1024 * 1024,
        );

        const result = await uploadToR2(largeFile, "media");
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

    it("handles upload errors gracefully", async () => {
        getCloudflareContextMock.mockRejectedValueOnce(
            new Error("unavailable"),
        );

        const result = await uploadToR2(createMockFile(), "files");
        expect(result.success).toBe(false);
        expect(result.error).toBe("unavailable");
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
