/**
 * API测试工具函数
 * 提供API测试的通用工具和断言函数
 */

import { expect } from "vitest";
import { server } from "../../../vitest.setup";
import { rest } from "msw";

// API响应类型定义
export interface ApiResponse<T = any> {
    status: number;
    ok: boolean;
    data: T;
    headers: Headers;
}

// 错误响应类型
export interface ErrorResponse {
    error: string;
    message?: string;
    code?: string;
    details?: any;
}

// 分页响应类型
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// HTTP状态码常量
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// API端点常量
export const API_ENDPOINTS = {
    HEALTH: "/api/health",
    AUTH: {
        SIGNIN: "/api/auth/signin",
        SIGNOUT: "/api/auth/signout",
        REGISTER: "/api/auth/register",
        ME: "/api/auth/me",
    },
    ADMIN: {
        USERS: "/api/admin/users",
        USER_DETAIL: (id: string) => `/api/admin/users/${id}`,
        PRODUCTS: "/api/admin/products",
        PRODUCT_DETAIL: (id: string) => `/api/admin/products/${id}`,
    },
    CREEM: {
        CREATE_PAYMENT_INTENT: "/api/creem/create-payment-intent",
        CREATE_SUBSCRIPTION: "/api/creem/create-subscription",
        SUBSCRIPTION_DETAIL: (id: string) => `/api/creem/subscription/${id}`,
        CANCEL_SUBSCRIPTION: (id: string) => `/api/creem/cancel-subscription/${id}`,
        PAYMENT_METHODS: "/api/creem/payment-methods",
        WEBHOOK: "/api/creem/webhook",
    },
    TODOS: {
        LIST: "/api/todos",
        DETAIL: (id: string) => `/api/todos/${id}`,
        CREATE: "/api/todos",
        UPDATE: (id: string) => `/api/todos/${id}`,
        DELETE: (id: string) => `/api/todos/${id}`,
    },
} as const;

// 自定义断言函数
export const expectValidApiResponse = <T>(response: ApiResponse<T>, expectedStatus = HTTP_STATUS.OK) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(expectedStatus < 400);
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe("object");
};

export const expectSuccessApiResponse = <T>(response: ApiResponse<T>) => {
    expectValidApiResponse(response, HTTP_STATUS.OK);
    expect(response.data).toHaveProperty("success", true);
};

export const expectCreatedApiResponse = <T>(response: ApiResponse<T>) => {
    expectValidApiResponse(response, HTTP_STATUS.CREATED);
    expect(response.data).toHaveProperty("success", true);
};

export const expectErrorApiResponse = (response: ApiResponse<ErrorResponse>, expectedStatus: number) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(false);
    expect(response.data).toHaveProperty("error");
    expect(typeof response.data.error).toBe("string");
};

export const expectPaginatedResponse = <T>(response: ApiResponse<PaginatedResponse<T>>) => {
    expectSuccessApiResponse(response);
    expect(response.data).toHaveProperty("data");
    expect(response.data).toHaveProperty("total");
    expect(response.data).toHaveProperty("page");
    expect(response.data).toHaveProperty("limit");
    expect(response.data).toHaveProperty("totalPages");
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(typeof response.data.total).toBe("number");
    expect(typeof response.data.page).toBe("number");
    expect(typeof response.data.limit).toBe("number");
    expect(typeof response.data.totalPages).toBe("number");
};

// Mock数据工厂函数
export const createMockAuthResponse = (overrides = {}) => ({
    success: true,
    user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "user",
        createdAt: new Date().toISOString(),
        ...overrides,
    },
});

export const createMockError = (message: string, status = HTTP_STATUS.INTERNAL_SERVER_ERROR) => ({
    error: message,
    status,
    timestamp: new Date().toISOString(),
});

export const createMockPaginatedResponse = <T>(
    data: T[],
    page = 1,
    limit = 10,
    total?: number
): PaginatedResponse<T> => ({
    data: data.slice((page - 1) * limit, page * limit),
    total: total || data.length,
    page,
    limit,
    totalPages: Math.ceil((total || data.length) / limit),
});

// MSW mock工具函数
export const createMockHandler = (
    method: "get" | "post" | "put" | "delete" | "patch",
    endpoint: string,
    response: any,
    status = HTTP_STATUS.OK
) => {
    return rest[method](endpoint, (req, res, ctx) => {
        return res(
            ctx.status(status),
            ctx.json(response)
        );
    });
};

export const createMockAuthHandler = (endpoint: string, response: any, status = HTTP_STATUS.OK) => {
    return rest.get(endpoint, (req, res, ctx) => {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return res(
                ctx.status(HTTP_STATUS.UNAUTHORIZED),
                ctx.json({ error: "Unauthorized" })
            );
        }

        return res(
            ctx.status(status),
            ctx.json(response)
        );
    });
};

export const createMockAdminHandler = (endpoint: string, response: any, status = HTTP_STATUS.OK) => {
    return rest.all(endpoint, (req, res, ctx) => {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return res(
                ctx.status(HTTP_STATUS.UNAUTHORIZED),
                ctx.json({ error: "Unauthorized" })
            );
        }

        // 模拟管理员权限检查
        const userRole = "admin"; // 在实际应用中从token解析
        if (userRole !== "admin") {
            return res(
                ctx.status(HTTP_STATUS.FORBIDDEN),
                ctx.json({ error: "Forbidden" })
            );
        }

        return res(
            ctx.status(status),
            ctx.json(response)
        );
    });
};

// 测试数据验证函数
export const expectValidUser = (user: any) => {
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("name");
    expect(user).toHaveProperty("role");
    expect(user).toHaveProperty("createdAt");
    expect(typeof user.id).toBe("string");
    expect(typeof user.email).toBe("string");
    expect(typeof user.name).toBe("string");
    expect(typeof user.role).toBe("string");
    expect(typeof user.createdAt).toBe("string");
};

export const expectValidTodo = (todo: any) => {
    expect(todo).toHaveProperty("id");
    expect(todo).toHaveProperty("title");
    expect(todo).toHaveProperty("completed");
    expect(todo).toHaveProperty("createdAt");
    expect(typeof todo.id).toBe("string");
    expect(typeof todo.title).toBe("string");
    expect(typeof todo.completed).toBe("boolean");
    expect(typeof todo.createdAt).toBe("string");
};

export const expectValidProduct = (product: any) => {
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("status");
    expect(product).toHaveProperty("createdAt");
    expect(typeof product.id).toBe("string");
    expect(typeof product.name).toBe("string");
    expect(typeof product.price).toBe("number");
    expect(typeof product.status).toBe("string");
    expect(typeof product.createdAt).toBe("string");
};

// 测试工具函数
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createTestFormData = (data: Record<string, any>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
    });
    return formData;
};

export const createTestQueryParams = (params: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    return searchParams.toString();
};

// 错误场景测试辅助函数
export const testUnauthorizedAccess = async (endpoint: string, method = "GET", body?: any) => {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(response.ok).toBe(false);

    const data = await response.json();
    expect(data).toHaveProperty("error");
};

export const testForbiddenAccess = async (endpoint: string, method = "GET", body?: any) => {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer non-admin-token",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(response.ok).toBe(false);

    const data = await response.json();
    expect(data).toHaveProperty("error");
};

export const testInvalidRequestBody = async (endpoint: string, method: "POST" | "PUT" | "PATCH", invalidBody: any) => {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
        },
        body: JSON.stringify(invalidBody),
    });

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(response.ok).toBe(false);

    const data = await response.json();
    expect(data).toHaveProperty("error");
};

// 性能测试辅助函数
export const measureApiResponseTime = async (endpoint: string, method = "GET", body?: any) => {
    const startTime = Date.now();

    const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
        response,
        responseTime,
    };
};

export const expectApiResponseTime = async (
    endpoint: string,
    maxTimeMs: number,
    method = "GET",
    body?: any
) => {
    const { responseTime } = await measureApiResponseTime(endpoint, method, body);
    expect(responseTime).toBeLessThan(maxTimeMs);
};