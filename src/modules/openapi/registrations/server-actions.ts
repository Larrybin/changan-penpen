import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
    apiErrorSchema,
    authRequiredResponseSchema,
} from "@/lib/openapi/schemas";
import { insertTodoSchema } from "@/modules/todos/schemas/todo.schema";

const TAG = "Internal Actions";

export function registerServerActionPaths(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "post",
        path: "/internal/actions/todos/create",
        tags: [TAG],
        summary: "Server Action：创建 Todo 任务",
        description:
            "仅供前端表单通过 Server Action 调用，用于演示型 Todo 功能。",
        request: {
            body: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: insertTodoSchema,
                    },
                },
            },
        },
        responses: {
            204: {
                description: "创建成功，Server Action 会触发页面重定向。",
            },
            400: {
                description: "表单校验失败",
                content: {
                    "application/json": {
                        schema: apiErrorSchema,
                    },
                },
            },
            401: {
                description: "未登录",
                content: {
                    "application/json": {
                        schema: authRequiredResponseSchema,
                    },
                },
            },
        },
        security: [{ BetterAuthSession: [] }],
    });
}
