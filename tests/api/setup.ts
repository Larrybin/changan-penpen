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

// API测试工具函数
export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        headers: DEFAULT_HEADERS,
        ...options,
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
        headers: AUTH_HEADERS,
        ...options,
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