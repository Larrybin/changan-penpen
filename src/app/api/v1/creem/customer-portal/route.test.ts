import { beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContextMock = vi.fn();
const requireSessionUserMock = vi.fn();
const requireCreemCustomerIdMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/modules/auth/utils/guards", () => ({
    requireSessionUser: requireSessionUserMock,
}));

vi.mock("@/modules/creem/utils/guards", () => ({
    requireCreemCustomerId: requireCreemCustomerIdMock,
}));

describe("GET /api/v1/creem/customer-portal", () => {
    beforeEach(() => {
        vi.resetModules();
        getCloudflareContextMock.mockReset();
        requireSessionUserMock.mockReset();
        requireCreemCustomerIdMock.mockReset();
        vi.unstubAllGlobals();
    });

    it("returns normalized portal URL on success", async () => {
        requireSessionUserMock.mockResolvedValue("user-1");
        requireCreemCustomerIdMock.mockResolvedValue("creem-1");
        getCloudflareContextMock.mockResolvedValue({
            env: {
                CREEM_API_URL: "https://creem.example",
                CREEM_API_KEY: "secret",
            },
        });

        const fetchMock = vi.fn(
            async () =>
                new Response(
                    JSON.stringify({
                        portal_url: "https://creem.example/portal",
                    }),
                    {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    },
                ),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { GET } = await import("./route");
        const response = await GET(
            new Request("https://app.example/api/v1/creem/customer-portal"),
        );

        expect(response.status).toBe(200);
        const payload = (await response.json()) as {
            success: boolean;
            data: { portalUrl: string };
        };
        expect(payload.success).toBe(true);
        expect(payload.data.portalUrl).toBe("https://creem.example/portal");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://creem.example/customers/billing",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ customer_id: "creem-1" }),
            }),
        );
    });

    it("propagates guard response when no customer mapping is found", async () => {
        const notFoundResponse = new Response(
            JSON.stringify({
                success: false,
                error: { code: "CREEM_CUSTOMER_NOT_FOUND" },
            }),
            { status: 404, headers: { "Content-Type": "application/json" } },
        );
        requireSessionUserMock.mockResolvedValue("user-1");
        requireCreemCustomerIdMock.mockResolvedValue(notFoundResponse);

        const { GET } = await import("./route");
        const response = await GET(
            new Request("https://app.example/api/v1/creem/customer-portal"),
        );

        expect(response).toBe(notFoundResponse);
        expect(fetch).toBeDefined();
    });

    it("maps upstream failures into 502 responses", async () => {
        requireSessionUserMock.mockResolvedValue("user-1");
        requireCreemCustomerIdMock.mockResolvedValue("creem-1");
        getCloudflareContextMock.mockResolvedValue({
            env: {
                CREEM_API_URL: "https://creem.example",
                CREEM_API_KEY: "secret",
            },
        });

        const fetchMock = vi.fn(
            async () =>
                new Response("Service unavailable", {
                    status: 503,
                    headers: { "Content-Type": "text/plain" },
                }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const { GET } = await import("./route");
        const response = await GET(
            new Request("https://app.example/api/v1/creem/customer-portal"),
        );

        expect(response.status).toBe(502);
        const body = await response.json();
        expect(body).toMatchObject({
            success: false,
            error: {
                code: "UPSTREAM_FAILURE",
                details: expect.objectContaining({ status: 503 }),
            },
        });
    });
});
