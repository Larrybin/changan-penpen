import { describe, expect, it } from "vitest";

import { getOpenApiDocument } from "@/lib/openapi/document";

describe("openapi document", () => {
    const document = getOpenApiDocument();

    it("exposes common metadata", () => {
        expect(document.info.title).toBe("Changan-penpen API");
        expect(document.components?.securitySchemes?.BetterAuthSession).toBeDefined();
    });

    it("registers summarize endpoint", () => {
        const summarize = document.paths?.["/api/summarize"]?.post;
        expect(summarize).toBeDefined();
        expect(summarize?.responses?.["200"]).toBeDefined();
    });

    it("registers usage endpoints", () => {
        expect(document.paths?.["/api/usage/record"]?.post).toBeDefined();
        expect(document.paths?.["/api/usage/stats"]?.get).toBeDefined();
    });

    it("registers credits endpoints", () => {
        expect(document.paths?.["/api/credits/balance"]?.get).toBeDefined();
        expect(document.paths?.["/api/credits/history"]?.get).toBeDefined();
    });

    it("registers admin endpoints", () => {
        expect(document.paths?.["/api/admin/session"]?.get).toBeDefined();
        expect(document.paths?.["/api/admin/usage"]?.get).toBeDefined();
    });

    it("marks server action path as internal", () => {
        const internal = document.paths?.["/internal/actions/todos/create"]?.post;
        expect(internal?.extensions?.["x-internal"]).toBe(true);
    });
});
