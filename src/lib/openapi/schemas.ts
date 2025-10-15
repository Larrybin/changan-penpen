import "./extend";
import type { ZodTypeAny } from "zod/v4";
import { z } from "zod/v4";

export const apiErrorSchema = z
    .object({
        success: z.literal(false).openapi({ example: false }),
        error: z.string().openapi({ example: "Internal server error" }),
        code: z.string().optional().openapi({ example: "ERR_UNEXPECTED" }),
        data: z.unknown().nullable().optional(),
    })
    .openapi({
        refId: "ApiErrorResponse",
        description: "通用错误响应封装，包含错误信息与可选错误码。",
    });

export const authRequiredResponseSchema = z
    .object({
        success: z.literal(false).openapi({ example: false }),
        error: z.string().openapi({ example: "Unauthorized" }),
    })
    .openapi({
        refId: "AuthRequiredResponse",
        description: "当请求缺少有效登录会话时返回。",
    });

export const adminUnauthorizedResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Unauthorized" }),
    })
    .openapi({
        refId: "AdminUnauthorizedResponse",
        description: "Admin 接口鉴权失败时的统一响应结构。",
    });

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
    .openapi({
        refId: "PaginationMeta",
        description: "通用分页元信息。",
    });

export function createSuccessResponseSchema<Schema extends ZodTypeAny>(
    schema: Schema,
    options: {
        refId?: string;
        description?: string;
        example?: unknown;
    } = {},
) {
    return z
        .object({
            success: z.literal(true).openapi({ example: true }),
            data: schema,
            error: z.unknown().nullable().optional().openapi({ example: null }),
        })
        .openapi({
            refId: options.refId,
            description: options.description,
            example: options.example,
        });
}
