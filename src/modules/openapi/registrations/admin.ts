import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod/v4";

import "@/lib/openapi/extend";
import {
    adminUnauthorizedResponseSchema,
    apiErrorSchema,
} from "@/lib/openapi/schemas";

const TAG = "Admin";

const adminUserSchema = z
    .object({
        id: z.string().openapi({ example: "user_123" }),
        name: z.string().openapi({ example: "Admin User" }),
        email: z.string().email().openapi({ example: "admin@example.com" }),
    })
    .openapi("AdminUser");

const adminSessionResponseSchema = z
    .object({
        user: adminUserSchema,
    })
    .openapi("AdminSessionResponse", {
        description: "Admin session 接口返回的当前管理员信息。",
    });

const adminUsageRowSchema = z
    .object({
        userId: z.string().openapi({ example: "tenant_1" }),
        date: z.string().openapi({ example: "2025-03-05" }),
        feature: z.string().openapi({ example: "ai.summarize" }),
        totalAmount: z.number().openapi({ example: 12 }),
        unit: z.string().openapi({ example: "calls" }),
        email: z.string().nullable().openapi({ example: "user@example.com" }),
    })
    .openapi("AdminUsageRow", {
        description: "管理员视角的用量记录。",
    });

const adminUsageResponseSchema = z
    .object({
        data: z.array(adminUsageRowSchema),
        total: z.number().int().openapi({ example: 120 }),
        nextCursor: z
            .string()
            .nullable()
            .optional()
            .openapi({ example: "eyJkYXRlIjoiMjAyNS0wMy0wNSJ9" }),
    })
    .openapi("AdminUsageResponse", {
        description: "Admin 用量列表 API 返回的聚合结果。",
    });

const adminCreditHistoryRowSchema = z
    .object({
        id: z.number().int().openapi({ example: 456 }),
        amount: z.number().openapi({ example: 100 }),
        type: z.string().openapi({ example: "MANUAL_ADJUST" }),
        description: z.string().openapi({ example: "手动调整：补发额度" }),
        createdAt: z.string().openapi({ example: "2025-03-05T09:30:00.000Z" }),
        customerEmail: z
            .string()
            .email()
            .nullable()
            .openapi({ example: "customer@example.com" }),
        userId: z.string().openapi({ example: "tenant_1" }),
    })
    .openapi("AdminCreditHistoryRow", {
        description: "积分流水记录（管理后台）。",
    });

const adminCreditHistoryResponseSchema = z
    .object({
        data: z.array(adminCreditHistoryRowSchema),
        total: z.number().int().openapi({ example: 200 }),
    })
    .openapi("AdminCreditHistoryResponse", {
        description: "管理员积分流水查询结果。",
    });

export function registerAdminPaths(registry: OpenAPIRegistry) {
    registry.registerPath({
        method: "get",
        path: "/api/v1/admin/session",
        tags: [TAG],
        summary: "校验当前登录用户是否具备管理员权限",
        description:
            "返回当前管理员的基础信息，供前端在进入后台前做鉴权与展示。",
        operationId: "getAdminSession",
        responses: {
            200: {
                description: "管理员会话有效",
                content: {
                    "application/json": {
                        schema: adminSessionResponseSchema,
                    },
                },
            },
            401: {
                description: "未登录或无管理员权限",
                content: {
                    "application/json": {
                        schema: adminUnauthorizedResponseSchema,
                    },
                },
            },
        },
        security: [{ BetterAuthSession: [] }],
    });

    registry.registerPath({
        method: "get",
        path: "/api/v1/admin/usage",
        tags: [TAG],
        summary: "分页查询租户用量概览",
        description:
            "查询所有租户的用量聚合数据，可按功能或租户过滤，用于后台报表。",
        operationId: "getAdminUsage",
        request: {
            query: z
                .object({
                    perPage: z.string().optional().openapi({ example: "20" }),
                    cursor: z
                        .string()
                        .optional()
                        .openapi({ example: "eyJkYXRlIjoiMjAyNS0wMy0wNSJ9" }),
                    tenantId: z
                        .string()
                        .optional()
                        .openapi({ example: "tenant_1" }),
                    feature: z
                        .string()
                        .optional()
                        .openapi({ example: "ai.summarize" }),
                })
                .openapi("AdminUsageQuery"),
        },
        responses: {
            200: {
                description: "查询成功",
                content: {
                    "application/json": {
                        schema: adminUsageResponseSchema,
                    },
                },
            },
            401: {
                description: "未登录或无管理员权限",
                content: {
                    "application/json": {
                        schema: adminUnauthorizedResponseSchema,
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
        path: "/api/v1/admin/credits-history",
        tags: [TAG],
        summary: "分页查询所有租户的积分流水",
        description: "管理员视角分页查看积分流水，用于对账与异常排查。",
        operationId: "getAdminCreditsHistory",
        request: {
            query: z
                .object({
                    page: z.string().optional().openapi({ example: "1" }),
                    perPage: z.string().optional().openapi({ example: "20" }),
                    tenantId: z
                        .string()
                        .optional()
                        .openapi({ example: "tenant_1" }),
                })
                .openapi("AdminCreditsHistoryQuery"),
        },
        responses: {
            200: {
                description: "查询成功",
                content: {
                    "application/json": {
                        schema: adminCreditHistoryResponseSchema,
                    },
                },
            },
            401: {
                description: "未登录或无管理员权限",
                content: {
                    "application/json": {
                        schema: adminUnauthorizedResponseSchema,
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
