import { beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContextMock = vi.fn();
const getDbMock = vi.fn();
const resolveAppUrlMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/db", () => ({
    getDb: getDbMock,
    siteSettings: {},
}));

vi.mock("@/lib/seo", () => ({
    resolveAppUrl: resolveAppUrlMock,
}));

describe("health route", () => {
    beforeEach(() => {
        vi.resetModules();
        getCloudflareContextMock.mockReset();
        getDbMock.mockReset();
        resolveAppUrlMock.mockReset();
        vi.unstubAllGlobals();
    });

    it("fast 模式跳过耗时检查", async () => {
        const env = {
            BETTER_AUTH_SECRET: "1",
            CLOUDFLARE_R2_URL: "2",
            next_cf_app_bucket: { list: vi.fn().mockResolvedValue({}) },
            HEALTH_REQUIRE_DB: "false",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "false",
            NEXT_PUBLIC_APP_URL: "https://app.example",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        getDbMock.mockResolvedValue({});
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const { GET } = await import("./route");
        const res = await GET(new Request("https://health.test/api/health?fast=1"));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(body.checks.db.ok).toBe(true);
        expect(body.checks.external.ok).toBe(true);
    });

    it("当要求外部依赖失败时返回 503", async () => {
        const env = {
            BETTER_AUTH_SECRET: "1",
            CLOUDFLARE_R2_URL: "2",
            next_cf_app_bucket: { list: vi.fn().mockResolvedValue({}) },
            HEALTH_REQUIRE_DB: "true",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "true",
            CREEM_API_URL: "https://creem.example",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        const failingDb = {
            select: () => ({
                from: () => ({
                    limit: vi.fn().mockRejectedValue(new Error("db down")),
                }),
            }),
        };
        getDbMock.mockResolvedValue(failingDb);
        const responses = [
            { status: 405, ok: false },
            { status: 503, ok: false },
        ];
        const fetchMock = vi
            .fn()
            .mockImplementation(() =>
                Promise.resolve(responses.shift() ?? { status: 503, ok: false }),
            );
        vi.stubGlobal("fetch", fetchMock);
        const { GET } = await import("./route");
        const res = await GET(new Request("https://health.test/api/health"));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.ok).toBe(false);
        expect(body.checks.db.ok).toBe(false);
        expect(body.checks.external.ok).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0]?.[0]).toBe("https://creem.example/status");
        expect(fetchMock.mock.calls[1]?.[0]).toBe("https://creem.example/status");
        expect(fetchMock.mock.calls[2]?.[0]).toBe("https://creem.example");
    });

    it("HEAD 405 时退回 GET 成功", async () => {
        const env = {
            BETTER_AUTH_SECRET: "1",
            CLOUDFLARE_R2_URL: "2",
            next_cf_app_bucket: { list: vi.fn().mockResolvedValue({}) },
            HEALTH_REQUIRE_DB: "false",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "true",
            CREEM_API_URL: "https://creem.example/",
            CREEM_API_KEY: "token",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        const dbMock = {
            select: () => ({
                from: () => ({ limit: vi.fn().mockResolvedValue([{ domain: "" }]) }),
            }),
        };
        getDbMock.mockResolvedValue(dbMock);
        const fetchMock = vi
            .fn()
            .mockImplementationOnce(() =>
                Promise.resolve({ status: 405, ok: false }),
            )
            .mockImplementationOnce(() =>
                Promise.resolve({ status: 200, ok: true }),
            );
        vi.stubGlobal("fetch", fetchMock);
        resolveAppUrlMock.mockReturnValue("https://resolved.example");
        const { GET } = await import("./route");
        const res = await GET(new Request("https://health.test/api/health"));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0]?.[0]).toBe("https://creem.example/status");
        expect(fetchMock.mock.calls[1]?.[0]).toBe("https://creem.example/status");
    });
});
