import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import "./extend";
export function createAppOpenApiRegistry() {
    const registry = new OpenAPIRegistry();

    registry.registerComponent("securitySchemes", "BetterAuthSession", {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description:
            "Better Auth 登录态 Cookie。前后端请求均需携带以访问受保护接口。",
    });

    return registry;
}
