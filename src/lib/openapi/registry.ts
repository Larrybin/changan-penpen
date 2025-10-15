import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "./extend";
import {
    adminUnauthorizedResponseSchema,
    apiErrorSchema,
    authRequiredResponseSchema,
    paginationSchema,
} from "./schemas";

export function createAppOpenApiRegistry() {
    const registry = new OpenAPIRegistry();

    registry.registerComponent("securitySchemes", "BetterAuthSession", {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description: "Better Auth 登录态 Cookie。前后端请求均需携带以访问受保护接口。",
    });

    registry.registerComponent("schemas", "ApiErrorResponse", apiErrorSchema);
    registry.registerComponent(
        "schemas",
        "AuthRequiredResponse",
        authRequiredResponseSchema,
    );
    registry.registerComponent(
        "schemas",
        "AdminUnauthorizedResponse",
        adminUnauthorizedResponseSchema,
    );
    registry.registerComponent("schemas", "PaginationMeta", paginationSchema);

    return registry;
}
