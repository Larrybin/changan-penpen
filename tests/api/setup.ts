/**
 * API测试专用配置
 * 为API集成测试提供统一的配置和工具函数
 */

import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "../../vitest.setup";

// API测试配置
export const API_BASE_URL = "http://localhost:3000";

// 通用测试headers
export const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

// 认证测试headers
export const AUTH_HEADERS = {
    ...DEFAULT_HEADERS,
    Authorization: "Bearer test-token",
};

export const ADMIN_HEADERS = {
    ...AUTH_HEADERS,
    Authorization: "Bearer admin-token",
    "X-User-Role": "admin",
};

// API测试工具函数
const mergeHeaders = (base: Headers, incoming?: HeadersInit) => {
    if (!incoming) {
        return;
    }

    if (incoming instanceof Headers) {
        incoming.forEach((value, key) => {
            base.set(key, value);
        });
        return;
    }

    if (Array.isArray(incoming)) {
        incoming.forEach(([key, value]) => {
            base.set(key, value);
        });
        return;
    }

    Object.entries(incoming).forEach(([key, value]) => {
        if (typeof value === "undefined") {
            return;
        }

        base.set(key, String(value));
    });
};

export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const { headers: optionHeaders, ...restOptions } = options;
    const mergedHeaders = new Headers(DEFAULT_HEADERS);
    mergeHeaders(mergedHeaders, optionHeaders);
    const response = await fetch(url, {
        ...restOptions,
        headers: mergedHeaders,
    });

    return {
        status: response.status,
        ok: response.ok,
        data: await response.json().catch(() => ({})),
        headers: response.headers,
    };
};

// 认证API请求
export const authenticatedApiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    return apiRequest(endpoint, {
        ...options,
        headers: {
            ...AUTH_HEADERS,
            ...(options.headers ?? {}),
        },
    });
};

export const adminApiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    return apiRequest(endpoint, {
        ...options,
        headers: {
            ...ADMIN_HEADERS,
            ...(options.headers ?? {}),
        },
    });
};

// 测试数据工厂
export const createTestUser = (overrides = {}) => ({
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "user",
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createTestTodo = (overrides = {}) => ({
    id: "test-todo-id",
    title: "Test Todo Item",
    description: "Test description",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
});

export const createTestProduct = (overrides = {}) => ({
    id: "test-product-id",
    name: "Test Product",
    description: "Test product description",
    price: 99.99,
    currency: "USD",
    status: "active",
    createdAt: new Date().toISOString(),
    ...overrides,
});

// 测试断言助手
export const expectSuccessResponse = (response: any, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(true);
    expect(response.data).toBeDefined();
};

export const expectErrorResponse = (response: any, expectedStatus: number) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(false);
    expect(response.data).toHaveProperty("error");
};

// API测试前置配置
beforeAll(() => {
    // 设置API测试环境变量
    process.env.NODE_ENV = "test";
    process.env.API_BASE_URL = API_BASE_URL;
});

// 每个测试后清理
afterEach(() => {
    // 清理可能的测试状态
    vi.clearAllMocks();
});

// 测试环境清理
afterAll(() => {
    // 清理API测试环境
    delete process.env.NODE_ENV;
    delete process.env.API_BASE_URL;
});