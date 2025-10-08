import { beforeEach, describe, expect, it, vi } from "vitest";

type CheckResult = { ok: true } | { ok: false; error?: string };

type HealthResponse = {
    ok: boolean;
    time: string;
    durationMs: number;
    mode: string;
    detailLevel: string;
    message?: string;
    checks: {
        db: CheckResult;
        r2: CheckResult;
        env: CheckResult;
        appUrl: CheckResult;
        external: CheckResult;
    };
};

function isCheckResult(value: unknown): value is CheckResult {
    if (!value || typeof value !== "object") {
        return false;
    }
    const record = value as Record<string, unknown>;
    if (record.ok !== true && record.ok !== false) {
        return false;
    }
    if (
        record.ok === false &&
        record.error !== undefined &&
        typeof record.error !== "string"
    ) {
        return false;
    }
    return true;
}

function assertHealthResponse(value: unknown): asserts value is HealthResponse {
    if (!value || typeof value !== "object") {
        throw new Error("健康检查响应必须是对象");
    }
    const record = value as Record<string, unknown>;
    if (typeof record.ok !== "boolean") {
        throw new Error("健康检查响应缺少 ok 字段");
    }
    if (typeof record.time !== "string") {
        throw new Error("健康检查响应缺少 time 字段");
    }
    if (typeof record.durationMs !== "number") {
        throw new Error("健康检查响应缺少 durationMs 字段");
    }
    if (typeof record.mode !== "string") {
        throw new Error("健康检查响应缺少 mode 字段");
    }
    if (typeof record.detailLevel !== "string") {
        throw new Error("健康检查响应缺少 detailLevel 字段");
    }
    const checks = record.checks;
    if (!checks || typeof checks !== "object") {
        throw new Error("健康检查响应缺少 checks 字段");
    }
    const { db, r2, env, appUrl, external } = checks as Record<string, unknown>;
    if (
        !isCheckResult(db) ||
        !isCheckResult(r2) ||
        !isCheckResult(env) ||
        !isCheckResult(appUrl) ||
        !isCheckResult(external)
    ) {
        throw new Error("健康检查响应包含无效的检查结果");
    }
}

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
            HEALTH_REQUIRE_DB: "true",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "false",
            NEXT_PUBLIC_APP_URL: "https://app.example",
            HEALTH_ACCESS_TOKEN: "token",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        getDbMock.mockResolvedValue({});
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const { GET } = await import("./route");
        const res = await GET(
            new Request("https://health.test/api/health?fast=1", {
                headers: { "x-health-token": "token" },
            }),
        );
        expect(fetchMock).not.toHaveBeenCalled();
        expect(res.status).toBe(200);
        const body = await res.json();
        assertHealthResponse(body);
        expect(body.ok).toBe(true);
        expect(body.checks.db.ok).toBe(true);
        expect(body.checks.external.ok).toBe(true);
    });

    it("支持通过 Authorization Bearer 令牌开启详细模式", async () => {
        const env = {
            BETTER_AUTH_SECRET: "1",
            CLOUDFLARE_R2_URL: "2",
            next_cf_app_bucket: { list: vi.fn().mockResolvedValue({}) },
            HEALTH_REQUIRE_DB: "false",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "false",
            NEXT_PUBLIC_APP_URL: "https://app.example",
            HEALTH_ACCESS_TOKEN: "token",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        const dbMock = {
            select: () => ({
                from: () => ({
                    limit: vi.fn().mockResolvedValue([{ domain: "" }]),
                }),
            }),
        };
        getDbMock.mockResolvedValue(dbMock);
        resolveAppUrlMock.mockReturnValue("https://resolved.example");

        const { GET } = await import("./route");
        const res = await GET(
            new Request("https://health.test/api/health", {
                headers: { Authorization: "Bearer token" },
            }),
        );

        expect(res.status).toBe(200);
        const body = await res.json();
        assertHealthResponse(body);
        expect(body.detailLevel).toBe("full");
        expect(body.checks.db.ok).toBe(true);
        expect(body.checks.env.ok).toBe(true);
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
            HEALTH_ACCESS_TOKEN: "token",
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
                Promise.resolve(
                    responses.shift() ?? { status: 503, ok: false },
                ),
            );
        vi.stubGlobal("fetch", fetchMock);
        const { GET } = await import("./route");
        const res = await GET(
            new Request("https://health.test/api/health", {
                headers: { "x-health-token": "token" },
            }),
        );
        expect(res.status).toBe(503);
        const body = await res.json();
        assertHealthResponse(body);
        expect(body.ok).toBe(false);
        expect(body.checks.db.ok).toBe(false);
        expect(body.checks.external.ok).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://creem.example/status",
        );
        expect(fetchMock.mock.calls[1]?.[0]).toBe(
            "https://creem.example/status",
        );
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
            HEALTH_ACCESS_TOKEN: "token",
        };
        getCloudflareContextMock.mockResolvedValue({ env });
        const dbMock = {
            select: () => ({
                from: () => ({
                    limit: vi.fn().mockResolvedValue([{ domain: "" }]),
                }),
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
        const res = await GET(
            new Request("https://health.test/api/health", {
                headers: { "x-health-token": "token" },
            }),
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        assertHealthResponse(body);
        expect(body.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
            "https://creem.example/status",
        );
        expect(fetchMock.mock.calls[1]?.[0]).toBe(
            "https://creem.example/status",
        );
    });

    it("在缺少令牌时仅返回概要信息", async () => {
        const env = {
            BETTER_AUTH_SECRET: "1",
            CLOUDFLARE_R2_URL: "2",
            next_cf_app_bucket: { list: vi.fn().mockResolvedValue({}) },
            HEALTH_REQUIRE_DB: "false",
            HEALTH_REQUIRE_R2: "false",
            HEALTH_REQUIRE_EXTERNAL: "false",
            NEXT_PUBLIC_APP_URL: "https://app.example",
            HEALTH_ACCESS_TOKEN: "token",
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
        const { GET } = await import("./route");
        const res = await GET(new Request("https://health.test/api/health"));
        expect(res.status).toBe(503);
        const body = await res.json();
        assertHealthResponse(body);
        expect(body.detailLevel).toBe("summary");
        expect(body.checks.db).toEqual({ ok: false });
        expect(Object.keys(body.checks.env)).toEqual(["ok"]);
        expect(body.message).toMatch(/Provide X-Health-Token/i);
    });
});
