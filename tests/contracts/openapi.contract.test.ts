import { describe, expect, it } from "vitest";

import { getOpenApiDocument } from "@/lib/openapi/document";

type SchemaObject = Record<string, unknown>;

describe("openapi contracts", () => {
    const document = getOpenApiDocument();
    const components = document.components?.schemas ?? {};

    function resolveRef(schema: SchemaObject | undefined): SchemaObject | undefined {
        if (!schema) return undefined;
        const ref = schema.$ref as string | undefined;
        if (!ref) return schema;
        const segments = ref.split("/");
        const name = segments[segments.length - 1];
        return components[name];
    }

    it("describes summarize response envelope", () => {
        const summarize = document.paths?.["/api/v1/summarize"]?.post;
        expect(summarize).toBeDefined();
        const response = summarize?.responses?.["200"];
        expect(response).toBeDefined();
        const content = response?.content?.["application/json"];
        const successSchema = resolveRef(content?.schema as SchemaObject | undefined);
        expect(successSchema).toBeDefined();
        expect(successSchema?.description).toContain("摘要接口");
        const properties = (successSchema?.properties ?? {}) as Record<string, SchemaObject>;
        expect(properties.success?.example).toBe(true);
        const dataRef = resolveRef(properties.data as SchemaObject | undefined);
        expect(dataRef?.properties).toMatchObject({
            summary: expect.anything(),
            originalLength: expect.anything(),
            summaryLength: expect.anything(),
        });
    });

    it("ensures usage stats endpoint documents auth failure", () => {
        const stats = document.paths?.["/api/v1/usage/stats"]?.get;
        expect(stats?.security).toEqual([{ BetterAuthSession: [] }]);
        const unauthorized = stats?.responses?.["401"];
        expect(unauthorized?.description).toContain("未登录");
        const authSchema = unauthorized?.content?.["application/json"]
            .schema as SchemaObject | undefined;
        expect(authSchema?.$ref).toContain("AuthRequiredResponse");
        const payload = resolveRef(authSchema);
        const errorProperties = (payload?.properties ?? {}) as Record<string, SchemaObject>;
        expect(errorProperties.success?.example).toBe(false);
        expect(errorProperties.error).toBeDefined();
    });

    it("reuses shared error schema for admin endpoints", () => {
        const adminSession = document.paths?.["/api/v1/admin/session"]?.get;
        expect(adminSession).toBeDefined();
        const failure = adminSession?.responses?.["401"];
        const schema = resolveRef(
            failure?.content?.["application/json"].schema as SchemaObject | undefined,
        );
        expect(schema?.example).toMatchObject({
            success: false,
            error: expect.objectContaining({ code: "UNAUTHORIZED" }),
        });
    });
});
