import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import handleApiError from "../api-error";

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
        const payload = (await response.json()) as Record<string, unknown>;
        expect(payload).toEqual({
            success: false,
            error: "Title is required",
            field: "title",
        });
    });

    it("handles syntax errors with a default message", async () => {
        const response = handleApiError(new SyntaxError("Unexpected token"));
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            success: false,
            error: "Invalid JSON format",
        });
    });

    it("falls back to generic errors", async () => {
        const response = handleApiError(new Error("Boom"));
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: "Boom",
        });
    });

    it("returns internal server error for unknown types", async () => {
        const response = handleApiError("something unexpected" as unknown);
        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            success: false,
            error: "Internal server error",
        });
    });
});
