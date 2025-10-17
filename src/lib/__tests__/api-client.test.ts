import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/http-error";

const ORIGINAL_FETCH = global.fetch;

describe("createApiClient", () => {
    const fetchMock = vi.fn<
        Parameters<typeof fetch>,
        ReturnType<typeof fetch>
    >();

    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        if (ORIGINAL_FETCH) {
            global.fetch = ORIGINAL_FETCH;
        }
    });

    it("prefixes the base URL and parses JSON responses", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ data: [1, 2, 3] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const client = createApiClient({ baseUrl: "/api/v1/admin" });
        const response = await client.get<{ data: number[] }>("/users");

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/admin/users",
            expect.objectContaining({ method: "GET" }),
        );
        expect(response.data).toEqual({ data: [1, 2, 3] });
    });

    it("throws ApiError with details for structured error payloads", async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: "INVALID_REQUEST",
                        message: "邮箱格式不正确",
                        details: {
                            field: "email",
                        },
                    },
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            ),
        );

        const client = createApiClient({ baseUrl: "/api" });

        const run = client.get("/users");
        await expect(run).rejects.toBeInstanceOf(ApiError);
        const error = (await run.catch((err) => err)) as ApiError;
        expect(error.status).toBe(400);
        expect(error.code).toBe("INVALID_REQUEST");
        expect((error.details as Record<string, unknown>).fieldErrors).toEqual({
            email: "邮箱格式不正确",
        });
    });

    it("captures rate-limit metadata when provided", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ message: "Too many" }), {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": "120",
                    "X-RateLimit-Limit": "10",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": "1700000000",
                },
            }),
        );

        const client = createApiClient({ baseUrl: "/api" });

        const run = client.get("/throttle");
        await expect(run).rejects.toBeInstanceOf(ApiError);
        const error = (await run.catch((err) => err)) as ApiError;
        const details = error.details as Record<string, unknown>;
        expect(details.retryAfterSeconds).toBe(120);
        expect(details.rateLimit).toMatchObject({
            limit: 10,
            remaining: 0,
        });
    });

    it("appends search parameters supplied via options", async () => {
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify({ data: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const client = createApiClient({ baseUrl: "/api/v1/admin" });
        await client.get("/users", {
            searchParams: {
                page: 2,
                perPage: 20,
                filter: "active",
            },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/admin/users?page=2&perPage=20&filter=active",
            expect.objectContaining({ method: "GET" }),
        );
    });
});
