import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import handleApiError from "../api-error";

type ErrorPayload = {
    success: boolean;
    status: number;
    error: Record<string, unknown>;
    timestamp: string;
    traceId: string;
};

describe("handleApiError", () => {
    it("formats validation errors with field metadata", async () => {
        const error = new z.ZodError([
            {
                code: "custom",
                message: "Title is required",
                path: ["title"],
            },
        ]);

        const response = handleApiError(error);
        expect(response.status).toBe(400);
        const payload = (await response.json()) as ErrorPayload;
        expect(payload).toMatchObject({
            success: false,
            status: 400,
            error: {
                code: "INVALID_REQUEST",
                message: "Title is required",
                details: {
                    field: "title",
                },
            },
        });
        expect(typeof payload.timestamp).toBe("string");
        expect(typeof payload.traceId).toBe("string");
    });

    it("handles syntax errors with a default message", async () => {
        const response = handleApiError(new SyntaxError("Unexpected token"));
        expect(response.status).toBe(400);
        const payload = (await response.json()) as ErrorPayload;
        expect(payload).toMatchObject({
            success: false,
            status: 400,
            error: {
                code: "INVALID_JSON",
                message: "Invalid JSON payload",
            },
        });
        expect(typeof payload.timestamp).toBe("string");
        expect(typeof payload.traceId).toBe("string");
    });

    it("falls back to generic errors", async () => {
        const response = handleApiError(new Error("Boom"));
        expect(response.status).toBe(500);
        const payload = (await response.json()) as ErrorPayload;
        expect(payload).toMatchObject({
            success: false,
            status: 500,
            error: {
                code: "INTERNAL_ERROR",
                message: "Boom",
            },
        });
        expect(typeof payload.timestamp).toBe("string");
        expect(typeof payload.traceId).toBe("string");
    });

    it("returns internal server error for unknown types", async () => {
        const response = handleApiError("something unexpected" as unknown);
        expect(response.status).toBe(500);
        const payload = (await response.json()) as ErrorPayload;
        expect(payload).toMatchObject({
            success: false,
            status: 500,
            error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error",
            },
        });
        expect(typeof payload.timestamp).toBe("string");
        expect(typeof payload.traceId).toBe("string");
    });
});
