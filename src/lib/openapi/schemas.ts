import "./extend";
import type { ZodTypeAny } from "zod/v4";
import { z } from "zod/v4";

const apiErrorDetailSchema = z
    .object({
        code: z
            .string()
            .min(1)
            .openapi({ example: "INVALID_REQUEST", description: "错误编码" }),
        message: z
            .string()
            .min(1)
            .openapi({ example: "参数校验失败", description: "错误信息" }),
        details: z
            .unknown()
            .optional()
            .openapi({ description: "可选的附加调试信息" }),
    })
    .openapi("ApiErrorDetail");

export const apiErrorSchema = z
    .object({
        success: z.literal(false).openapi({ example: false }),
        error: apiErrorDetailSchema,
        status: z.number().int().openapi({ example: 400 }),
        timestamp: z.string().openapi({
            example: "2025-03-05T12:34:56.000Z",
            description: "ISO 时间戳",
        }),
        traceId: z.string().openapi({
            example: "8f4c2e7a9b",
            description: "用于日志关联的追踪 ID",
        }),
    })
    .openapi("ApiErrorResponse", {
        description: "标准化的错误响应结构。",
        example: {
            success: false,
            status: 400,
            timestamp: "2025-03-05T12:34:56.000Z",
            traceId: "8f4c2e7a9b",
            error: {
                code: "INVALID_REQUEST",
                message: "参数校验失败",
                details: { field: "email" },
            },
        },
    });

export const authRequiredResponseSchema = apiErrorSchema.openapi(
    "AuthRequiredResponse",
    {
        description: "当请求缺少有效登录会话时返回。",
        example: {
            success: false,
            status: 401,
            timestamp: "2025-03-05T12:34:56.000Z",
            traceId: "auth-unauthorized",
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
            },
        },
    },
);

export const adminUnauthorizedResponseSchema = apiErrorSchema.openapi(
    "AdminUnauthorizedResponse",
    {
        description: "Admin 接口鉴权失败时的统一响应结构。",
        example: {
            success: false,
            status: 401,
            timestamp: "2025-03-05T12:34:56.000Z",
            traceId: "admin-unauthorized",
            error: {
                code: "UNAUTHORIZED",
                message: "Administrator privileges required",
            },
        },
    },
);

export const paginationSchema = z
    .object({
        total: z
            .number()
            .int()
            .min(0)
            .openapi({ example: 120, description: "总记录数" }),
        pages: z
            .number()
            .int()
            .min(0)
            .openapi({ example: 12, description: "总页数" }),
        current: z
            .number()
            .int()
            .min(1)
            .openapi({ example: 1, description: "当前页码（从 1 开始）" }),
    })
    .openapi("PaginationMeta", {
        description: "通用分页元信息。",
    });

export function createSuccessResponseSchema<Schema extends ZodTypeAny>(
    schema: Schema,
    options: {
        refId?: string;
        description?: string;
        example?: unknown;
    } = {},
): ZodTypeAny {
    const schemaWithEnvelope = z.object({
        success: z.literal(true).openapi({ example: true }),
        data: schema,
        error: z.unknown().nullable().optional().openapi({ example: null }),
    });

    const { refId, description, example } = options;

    const metadata = {
        description,
        example,
    };

    if (refId) {
        return schemaWithEnvelope.openapi(refId, metadata);
    }

    return schemaWithEnvelope.openapi(metadata);
}
