import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod/v4";

import "@/lib/openapi/extend";
import {
    apiErrorSchema,
    authRequiredResponseSchema,
    createSuccessResponseSchema,
    paginationSchema,
} from "@/lib/openapi/schemas";

const TAG = "Credits";

const creditBalanceDataSchema = z
    .object({
        credits: z
            .number()
            .int()
            .min(0)
            .openapi({ example: 480, description: "当前积分余额" }),
    })
    .openapi("CreditBalancePayload", {
        description: "余额查询返回的积分数据。",
    });

const creditBalanceResponseSchema = createSuccessResponseSchema(
    creditBalanceDataSchema,
    {
        refId: "CreditBalanceResponse",
        description: "积分余额查询成功时返回。",
        example: { success: true, data: { credits: 480 }, error: null },
    },
);

const creditTransactionSchema = z
    .object({
        id: z.number().int().openapi({ example: 123 }),
        amount: z.number().openapi({ example: 50 }),
        remainingAmount: z
            .number()
            .openapi({ example: 20, description: "尚未消耗的数量" }),
        type: z
            .string()
            .openapi({ example: "MONTHLY_REFRESH", description: "交易类型" }),
        description: z.string().openapi({ example: "月度额度刷新" }),
        expirationDate: z.string().nullable().openapi({
            description: "过期时间（如有）",
            example: "2025-04-01T00:00:00.000Z",
        }),
        paymentIntentId: z.string().nullable().openapi({ example: null }),
        createdAt: z.string().openapi({ example: "2025-03-01T10:00:00.000Z" }),
        updatedAt: z.string().openapi({ example: "2025-03-01T10:00:00.000Z" }),
    })
    .openapi("CreditTransaction", {
        description: "积分流水记录。",
    });

const creditHistoryDataSchema = z
    .object({
        transactions: z
            .array(creditTransactionSchema)
            .openapi({ description: "流水列表" }),
        pagination: paginationSchema,
    })
    .openapi("CreditHistoryPayload", {
        description: "积分流水查询结果。",
    });

const creditHistoryResponseSchema = createSuccessResponseSchema(
    creditHistoryDataSchema,
    {
        refId: "CreditHistoryResponse",
        description: "积分流水分页查询成功时返回。",
    },
);

export function registerCreditsPaths(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "get",
        path: "/api/v1/credits/balance",
        tags: [TAG],
        summary: "查询当前积分余额（自动刷新月度赠送）",
        description:
            "返回当前用户的积分余额，包含月度赠送额度刷新后的最新结果。",
        operationId: "getCreditsBalance",
        responses: {
            200: {
                description: "查询成功",
                content: {
                    "application/json": {
                        schema: creditBalanceResponseSchema,
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
            500: {
                description: "内部错误",
                content: {
                    "application/json": {
                        schema: apiErrorSchema,
                    },
                },
            },
        },
        security: [{ BetterAuthSession: [] }],
    });

    registry.registerPath({
        method: "get",
        path: "/api/v1/credits/history",
        tags: [TAG],
        summary: "分页查询积分流水记录",
        description:
            "分页返回积分流水明细，可用于账单与对账场景。",
        operationId: "getCreditsHistory",
        request: {
            query: z
                .object({
                    page: z
                        .string()
                        .optional()
                        .openapi({ example: "1", description: "页码" }),
                    limit: z
                        .string()
                        .optional()
                        .openapi({ example: "10", description: "每页条数" }),
                })
                .openapi("CreditHistoryQuery"),
        },
        responses: {
            200: {
                description: "查询成功",
                content: {
                    "application/json": {
                        schema: creditHistoryResponseSchema,
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
            500: {
                description: "内部错误",
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
