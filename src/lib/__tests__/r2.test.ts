import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromR2, uploadToR2 } from "../r2";

const getCloudflareContextMock = vi.hoisted(() => vi.fn());
vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

function createMockFile(name = "image.png", type = "image/png") {
    return {
        name,
        type,
        size: 4,
        arrayBuffer: vi
            .fn()
            .mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
    } as unknown as File;
}

describe("r2 utilities", () => {
    beforeEach(() => {
        getCloudflareContextMock.mockReset();
        vi.clearAllMocks();
        vi.spyOn(Date, "now").mockReturnValue(1700000000000);
        vi.spyOn(Math, "random").mockReturnValue(0.123456789);
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        expect(result.key).toMatch(/^media\/1700000000000_\w+\.png$/);
        expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/media\//);
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
