import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod/v4";

import "@/lib/openapi/extend";
import {
    apiErrorSchema,
    authRequiredResponseSchema,
    createSuccessResponseSchema,
} from "@/lib/openapi/schemas";

const TAG = "Usage";

const usageRecordRequestSchema = z
    .object({
        feature: z
            .string()
            .min(1)
            .openapi({ example: "ai.summarize", description: "功能唯一标识" }),
        amount: z
            .number()
            .positive()
            .openapi({ example: 1, description: "本次使用量" }),
        unit: z
            .string()
            .min(1)
            .openapi({ example: "calls", description: "计量单位" }),
        metadata: z
            .record(z.string(), z.unknown())
            .optional()
            .openapi({
                description: "业务侧自定义的扩展字段",
                example: { source: "dashboard", model: "llama" },
            }),
        consumeCredits: z.number().positive().optional().openapi({
            description: "同时扣减的积分数量，可选",
            example: 5,
        }),
    })
    .openapi("UsageRecordRequest", {
        description: "记录用量时提交的请求体。",
    });

const usageRecordDataSchema = z
    .object({
        date: z
            .string()
            .openapi({ example: "2025-03-05", description: "记录所属日期" }),
        credits: z.number().nullable().openapi({
            description: "扣减后剩余积分，若不扣减则为 null",
            example: 420,
        }),
    })
    .openapi("UsageRecordResult", {
        description: "记录成功后返回的日期与剩余积分。",
    });

const usageRecordResponseSchema = createSuccessResponseSchema(
    usageRecordDataSchema,
    {
        refId: "UsageRecordResponse",
        description: "记录用量成功时的响应体。",
        example: {
            success: true,
            data: { date: "2025-03-05", credits: 420 },
            error: null,
        },
    },
);

const usageStatsRowSchema = z
    .object({
        date: z
            .string()
            .openapi({ example: "2025-03-01", description: "统计日期" }),
        feature: z
            .string()
            .openapi({ example: "ai.summarize", description: "功能唯一标识" }),
        totalAmount: z
            .number()
            .openapi({ example: 25, description: "当日累计使用量" }),
        unit: z.string().openapi({ example: "calls" }),
    })
    .openapi("UsageStatsRow", {
        description: "每日用量明细。",
    });

const usageStatsDataSchema = z
    .object({
        fromDate: z
            .string()
            .openapi({ example: "2025-02-04", description: "统计起始日期" }),
        toDate: z
            .string()
            .openapi({ example: "2025-03-05", description: "统计结束日期" }),
        rows: z
            .array(usageStatsRowSchema)
            .openapi({ description: "每日聚合结果列表" }),
    })
    .openapi("UsageStatsPayload", {
        description: "Usage Stats 接口返回的聚合数据。",
    });

const usageStatsResponseSchema = createSuccessResponseSchema(
    usageStatsDataSchema,
    {
        refId: "UsageStatsResponse",
        description: "用量统计查询的响应体。",
        example: {
            success: true,
            data: {
                fromDate: "2025-02-04",
                toDate: "2025-03-05",
                rows: [
                    {
                        date: "2025-03-05",
                        feature: "ai.summarize",
                        totalAmount: 3,
                        unit: "calls",
                    },
                ],
            },
            error: null,
        },
    },
);

export function registerUsagePaths(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "post",
        path: "/api/v1/usage/record",
        tags: [TAG],
        summary: "记录用户某项功能的用量",
        description:
            "将指定功能的消耗写入用量表，可选同时扣减积分；用于后台统计与限额控制。",
        operationId: "postUsageRecord",
        request: {
            body: {
                required: true,
                content: {
                    "application/json": {
                        schema: usageRecordRequestSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "记录成功",
                content: {
                    "application/json": {
                        schema: usageRecordResponseSchema,
                    },
                },
            },
            400: {
                description: "请求参数校验失败",
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
        path: "/api/v1/usage/stats",
        tags: [TAG],
        summary: "按日聚合查询用量统计",
        description:
            "按日期聚合返回指定窗口的用量信息，便于仪表盘展示与配额跟踪。",
        operationId: "getUsageStats",
        request: {
            query: z
                .object({
                    days: z.string().optional().openapi({
                        description: "查询最近 N 天，默认 30，最大 90",
                        example: "30",
                    }),
                })
                .openapi("UsageStatsQuery"),
        },
        responses: {
            200: {
                description: "统计查询成功",
                content: {
                    "application/json": {
                        schema: usageStatsResponseSchema,
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
