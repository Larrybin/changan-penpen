import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
    apiErrorSchema,
    authRequiredResponseSchema,
    createSuccessResponseSchema,
} from "@/lib/openapi/schemas";
import {
    summarizeRequestSchema,
    summaryResultSchema,
} from "@/services/summarizer.service";

const TAG = "AI";

export function registerSummarizePaths(registry: OpenAPIRegistry) {
    const successSchema = createSuccessResponseSchema(summaryResultSchema, {
        refId: "SummarizeSuccessResponse",
        description: "AI 文本摘要接口返回的摘要结果。",
        example: {
            success: true,
            data: {
                summary:
                    "The announcement introduces a toolset that simplifies AI application delivery...",
                originalLength: 1024,
                summaryLength: 256,
                tokensUsed: { input: 350, output: 90 },
            },
            error: null,
        },
    });

    registry.registerPath({
        method: "post",
        path: "/api/summarize",
        tags: [TAG],
        summary: "基于 Workers AI 对长文本进行摘要",
        request: {
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: summarizeRequestSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "摘要生成成功",
                content: {
                    "application/json": {
                        schema: successSchema,
                    },
                },
            },
            401: {
                description: "未登录或会话失效",
                content: {
                    "application/json": {
                        schema: authRequiredResponseSchema,
                    },
                },
            },
            500: {
                description: "Workers AI 不可用或内部错误",
                content: {
                    "application/json": {
                        schema: apiErrorSchema,
                    },
                },
            },
        },
        security: [{ BetterAuthSession: [] }],
    });
}
