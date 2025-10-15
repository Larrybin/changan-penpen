import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

import { resolveAppUrl } from "@/lib/seo";
import { createAppOpenApiRegistry } from "./registry";
import { registerAllOpenApiPaths } from "@/modules/openapi/register";

const DEFAULT_SERVER = "http://localhost:3000";

let documentCache:
    | ReturnType<OpenApiGeneratorV31["generateDocument"]>
    | null = null;

export function getOpenApiDocument() {
    if (documentCache) {
        return documentCache;
    }

    const registry = createAppOpenApiRegistry();
    registerAllOpenApiPaths(registry);

    const generator = new OpenApiGeneratorV31(registry.definitions);

    let serverUrl = DEFAULT_SERVER;
    try {
        serverUrl = resolveAppUrl(null, {
            envAppUrl: process.env.NEXT_PUBLIC_APP_URL,
        });
    } catch (error) {
        console.warn("[openapi] 使用默认服务器地址", { error });
    }

    documentCache = generator.generateDocument({
        openapi: "3.1.0",
        info: {
            title: "Changan-penpen API",
            version: "1.0.0",
            description:
                "自动生成的 OpenAPI 文档，结合 Zod schema 同步维护 API 与 Server Action。",
        },
        servers: [
            {
                url: serverUrl,
                description: "默认应用访问地址，可在 NEXT_PUBLIC_APP_URL 中覆盖",
            },
        ],
        security: [{ BetterAuthSession: [] }],
        tags: [
            { name: "AI", description: "AI 摘要能力" },
            { name: "Usage", description: "用量记录与统计" },
            { name: "Credits", description: "积分余额与流水" },
            { name: "Admin", description: "管理后台接口" },
            {
                name: "Internal Actions",
                description: "仅供内部 Server Action 使用的文档化说明",
            },
        ],
    });

    return documentCache;
}
