import { getCloudflareContext } from "@opennextjs/cloudflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireSessionUser } from "@/modules/auth/utils/guards";
import { requireCreemCustomerId } from "@/modules/creem/utils/guards";
import { GET } from "./route";

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: vi.fn(),
}));

vi.mock("@/modules/auth/utils/guards", () => ({
    requireSessionUser: vi.fn(),
}));

vi.mock("@/modules/creem/utils/guards", () => ({
    requireCreemCustomerId: vi.fn(),
}));

describe("GET /api/creem/customer-portal", () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn<
        [input: RequestInfo | URL, init?: RequestInit | undefined],
        Promise<Response>
    >();
    const requestUrl = "https://example.com/api/creem/customer-portal";

    const makeRequest = () => new Request(requestUrl);

    const makeJsonResponse = (body: unknown, init?: ResponseInit) =>
        new Response(JSON.stringify(body), {
            status: 200,
            headers: { "content-type": "application/json" },
            ...init,
        });

    const mockSuccessfulGuards = async (options?: {
        userId?: string;
        customerId?: string;
    }) => {
        const userId = options?.userId ?? "user_123";
        const customerId = options?.customerId ?? "creem_456";
        vi.mocked(requireSessionUser).mockResolvedValue(userId);
        vi.mocked(requireCreemCustomerId).mockResolvedValue(customerId);
        vi.mocked(getCloudflareContext).mockResolvedValue({
            env: {
                CREEM_API_URL: "https://creem.test",
                CREEM_API_KEY: "secret",
            },
        });
        return { userId, customerId };
    };

    beforeEach(() => {
        vi.resetAllMocks();
        fetchMock.mockReset();
        globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it("returns portalUrl when upstream succeeds", async () => {
        const { userId, customerId } = await mockSuccessfulGuards();

        const upstreamBody = { portal_url: "https://creem.test/portal" };
        fetchMock.mockResolvedValue(makeJsonResponse(upstreamBody));

        const request = makeRequest();
        const response = await GET(request);

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload).toEqual({
            success: true,
            data: { portalUrl: "https://creem.test/portal" },
            error: null,
            meta: { raw: upstreamBody },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://creem.test/customers/billing",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "x-api-key": "secret",
                    "Content-Type": "application/json",
                }),
            }),
        );
        const fetchInit = fetchMock.mock.calls[0]?.[1];
        expect(fetchInit?.body).toBeDefined();
        const parsedBody = JSON.parse(fetchInit?.body as string);
        expect(parsedBody).toEqual({ customer_id: customerId });
        expect(requireSessionUser).toHaveBeenCalledWith(request);
        expect(requireCreemCustomerId).toHaveBeenCalledWith(userId);
        expect(getCloudflareContext).toHaveBeenCalledWith({ async: true });
    });

    it("returns 502 when upstream payload lacks url", async () => {
        await mockSuccessfulGuards();

        fetchMock.mockResolvedValue(
            makeJsonResponse({ message: "no url" }, { status: 200 }),
        );

        const request = makeRequest();
        const response = await GET(request);

        expect(response.status).toBe(502);
        const payload = await response.json();
        expect(payload).toEqual({
            success: false,
            error: "Invalid response from Creem: missing portal url",
            data: null,
        });
    });

    it("maps upstream 404 error to 400 response", async () => {
        await mockSuccessfulGuards();

        fetchMock.mockResolvedValue(
            new Response("not found", {
                status: 404,
                headers: { "content-type": "text/plain" },
            }),
        );

        const request = makeRequest();
        const response = await GET(request);

        expect(response.status).toBe(400);
        const payload = await response.json();
        expect(payload).toMatchObject({
            success: false,
            error: "Failed to get portal link",
            meta: {
                status: 404,
                upstreamBodySnippet: "not found",
            },
            data: null,
        });
    });

    it("maps upstream 401 errors to 401", async () => {
        await mockSuccessfulGuards();

        fetchMock.mockResolvedValue(
            makeJsonResponse({ message: "unauthorized" }, { status: 401 }),
        );

        const response = await GET(makeRequest());

        expect(response.status).toBe(401);
        expect(await response.json()).toMatchObject({
            success: false,
            error: "Failed to get portal link",
            meta: { status: 401 },
        });
    });

    it("maps upstream 500 errors to 502 and keeps snippet", async () => {
        await mockSuccessfulGuards();
        const failureResponse = new Response(
            "Service unavailable for maintenance",
            { status: 503 },
        );
        fetchMock
            .mockResolvedValueOnce(failureResponse.clone())
            .mockResolvedValueOnce(failureResponse.clone())
            .mockResolvedValueOnce(failureResponse.clone());

        vi.useFakeTimers();
        try {
            const responsePromise = GET(makeRequest());
            await vi.runAllTimersAsync();
            const response = await responsePromise;

            expect(response.status).toBe(502);
            const payload = await response.json();
            expect(payload).toMatchObject({
                success: false,
                error: "Failed to get portal link",
                meta: {
                    status: 503,
                    upstreamBodySnippet: "Service unavailable for maintenance",
                },
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it("returns guard responses when session guard fails", async () => {
        const guardResponse = new Response("unauthorized", { status: 401 });
        vi.mocked(requireSessionUser).mockResolvedValue(guardResponse as never);

        const response = await GET(makeRequest());

        expect(response).toBe(guardResponse);
        expect(requireCreemCustomerId).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns guard responses when customer guard fails", async () => {
        vi.mocked(requireSessionUser).mockResolvedValue("user_abc");
        const guardResponse = new Response("missing customer", { status: 404 });
        vi.mocked(requireCreemCustomerId).mockResolvedValue(
            guardResponse as never,
        );

        const response = await GET(makeRequest());

        expect(response).toBe(guardResponse);
        expect(getCloudflareContext).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns 500 when CREEM env vars are missing", async () => {
        vi.mocked(requireSessionUser).mockResolvedValue("user_env");
        vi.mocked(requireCreemCustomerId).mockResolvedValue("creem_env");
        vi.mocked(getCloudflareContext).mockResolvedValue({
            env: { CREEM_API_URL: "", CREEM_API_KEY: "" },
        });

        const response = await GET(makeRequest());

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: "Missing CREEM_API_URL or CREEM_API_KEY",
            data: null,
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns 502 and propagates error info when fetch rejects", async () => {
        await mockSuccessfulGuards();

        fetchMock.mockRejectedValue(new Error("network down"));

        vi.useFakeTimers();
        try {
            const responsePromise = GET(makeRequest());
            await vi.runAllTimersAsync();
            const response = await responsePromise;

            expect(response.status).toBe(502);
            expect(await response.json()).toMatchObject({
                success: false,
                error: "Failed to get portal link",
                meta: { status: 0, upstreamBodySnippet: "network down" },
            });
        } finally {
            vi.useRealTimers();
        }
    });
});
