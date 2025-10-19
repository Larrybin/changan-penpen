import { beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContextMock = vi.fn();
const applyRateLimitMock = vi.fn();
const getAuthInstanceMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/lib/rate-limit", () => ({
    applyRateLimit: applyRateLimitMock,
}));

vi.mock("@/modules/auth/utils/auth-utils", () => ({
    getAuthInstance: getAuthInstanceMock,
}));

describe("POST /api/v1/creem/create-checkout", () => {
    beforeEach(() => {
        vi.resetModules();
        getCloudflareContextMock.mockReset();
        applyRateLimitMock.mockReset();
        getAuthInstanceMock.mockReset();
        vi.unstubAllGlobals();
    });

    it("returns checkout URL when upstream succeeds", async () => {
        getAuthInstanceMock.mockResolvedValue({
            api: {
                getSession: vi.fn().mockResolvedValue({
                    user: { id: "user-1", email: "buyer@example.com" },
                }),
            },
        });
        getCloudflareContextMock.mockResolvedValue({
            env: {
                CREEM_API_URL: "https://creem.example",
                CREEM_API_KEY: "secret",
                RATE_LIMITER: "kv://ratelimit",
                UPSTASH_REDIS_REST_URL: "https://redis.example",
                UPSTASH_REDIS_REST_TOKEN: "token",
            },
        });
        applyRateLimitMock.mockResolvedValue({ ok: true });

        const fetchMock = vi.fn(
            async () =>
                new Response(
                    JSON.stringify({
                        checkout_url: "https://creem.example/pay",
                    }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    },
                ),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { POST } = await import("./route");
        const request = new Request(
            "https://app.example/api/v1/creem/create-checkout",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    origin: "https://app.example",
                },
                body: JSON.stringify({
                    tierId: "tier-6-credits",
                    productType: "credits",
                }),
            },
        );

        const response = await POST(request);
        expect(response.status).toBe(200);
        const payload = (await response.json()) as {
            success: boolean;
            data: { checkoutUrl: string };
        };
        expect(payload.success).toBe(true);
        expect(payload.data.checkoutUrl).toBe("https://creem.example/pay");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://creem.example/checkouts",
            expect.objectContaining({
                method: "POST",
            }),
        );
    });

    it("fails with SERVICE_UNAVAILABLE when required env vars missing", async () => {
        getAuthInstanceMock.mockResolvedValue({
            api: {
                getSession: vi.fn().mockResolvedValue({
                    user: { id: "user-1", email: "buyer@example.com" },
                }),
            },
        });
        getCloudflareContextMock.mockResolvedValue({
            env: {
                CREEM_API_KEY: "secret",
            },
        });
        applyRateLimitMock.mockResolvedValue({ ok: true });

        const { POST } = await import("./route");
        const request = new Request(
            "https://app.example/api/v1/creem/create-checkout",
            {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ productType: "subscription" }),
            },
        );

        const response = await POST(request);
        expect(response.status).toBe(503);
        const body = await response.json();
        expect(body).toMatchObject({
            success: false,
            error: {
                code: "SERVICE_UNAVAILABLE",
            },
        });
    });

    it("maps upstream 400 errors into ApiError payload", async () => {
        getAuthInstanceMock.mockResolvedValue({
            api: {
                getSession: vi.fn().mockResolvedValue({
                    user: { id: "user-1", email: "buyer@example.com" },
                }),
            },
        });
        getCloudflareContextMock.mockResolvedValue({
            env: {
                CREEM_API_URL: "https://creem.example",
                CREEM_API_KEY: "secret",
                RATE_LIMITER: "kv://ratelimit",
                UPSTASH_REDIS_REST_URL: "https://redis.example",
                UPSTASH_REDIS_REST_TOKEN: "token",
            },
        });
        applyRateLimitMock.mockResolvedValue({ ok: true });

        const fetchMock = vi.fn(
            async () =>
                new Response("bad request", {
                    status: 400,
                    headers: { "Content-Type": "text/plain" },
                }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { POST } = await import("./route");
        const request = new Request(
            "https://app.example/api/v1/creem/create-checkout",
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    origin: "https://app.example",
                },
                body: JSON.stringify({
                    tierId: "tier-pro",
                    productType: "subscription",
                }),
            },
        );

        const response = await POST(request);
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body).toMatchObject({
            success: false,
            error: {
                code: "UPSTREAM_BAD_REQUEST",
                details: expect.objectContaining({ status: 400 }),
            },
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://creem.example/checkouts",
            expect.objectContaining({
                method: "POST",
            }),
        );
    });
});
