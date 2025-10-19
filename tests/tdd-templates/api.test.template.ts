/**
 * API端点TDD测试模板
 * 基于MSW和现代API测试最佳实践
 * 遵循测试驱动开发原则
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { server } from "../../vitest.setup";
import { http, HttpResponse } from "msw";
import { apiRequest, expectSuccessResponse, expectErrorResponse } from "../api/setup";

/**
 * API TDD测试模板使用说明
 *
 * 1. 复制此模板到API测试文件
 * 2. 替换/api/endpoint为实际API路径
 * 3. 根据API特性调整测试用例
 * 4. 遵循红-绿-重构TDD循环
 */

// 测试数据工厂
const createMockRequestData = (overrides = {}) => ({
    // 在这里定义API请求的默认数据
    field1: "default value",
    field2: "default value",
    ...overrides,
});

const createMockResponseData = (overrides = {}) => ({
    // 在这里定义API响应的默认数据
    id: "mock-id",
    success: true,
    ...overrides,
});

describe("/api/endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        server.resetHandlers();
    });

    describe("基础功能测试", () => {
        it("应该处理成功请求", async () => {
            const requestData = createMockRequestData();
            const expectedResponse = createMockResponseData({
                id: "test-id",
                field1: requestData.field1,
            });

            // 设置MSW mock响应
            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(expectedResponse);
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toEqual(expectedResponse);
        });

        it("应该返回正确的HTTP状态码", async () => {
            const requestData = createMockRequestData();
            const expectedStatus = 201; // 创建成功

            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(
                        createMockResponseData(),
                        { status: expectedStatus }
                    );
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            expect(response.status).toBe(expectedStatus);
            expect(response.ok).toBe(true);
        });

        it("应该设置正确的响应头", async () => {
            const requestData = createMockRequestData();

            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(
                        createMockResponseData(),
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/json",
                                "Cache-Control": "no-cache",
                            },
                        }
                    );
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(requestData),
            });

            expect(response.headers.get("content-type")).toContain("application/json");
            expect(response.headers.get("cache-control")).toBe("no-cache");
        });
    });

    describe("验证测试", () => {
        it("应该验证必填字段", async () => {
            const invalidData = createMockRequestData({
                field1: "", // 空值测试
            });

            server.use(
                http.post("/api/endpoint", async ({ request }) => {
                    const body = await request.json() as any;

                    if (!body.field1 || body.field1.trim() === "") {
                        return HttpResponse.json(
                            { error: "field1 is required" },
                            { status: 400 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.error).toBe("field1 is required");
        });

        it("应该验证字段格式", async () => {
            const invalidData = createMockRequestData({
                field2: "invalid-email", // 邮箱格式测试
            });

            server.use(
                http.post("/api/endpoint", async ({ request }) => {
                    const body = await request.json() as any;

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(body.field2)) {
                        return HttpResponse.json(
                            { error: "Invalid email format" },
                            { status: 400 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.error).toBe("Invalid email format");
        });

        it("应该验证字段长度", async () => {
            const invalidData = createMockRequestData({
                field1: "a".repeat(301), // 超长测试
            });

            server.use(
                http.post("/api/endpoint", async ({ request }) => {
                    const body = await request.json() as any;

                    if (body.field1.length > 300) {
                        return HttpResponse.json(
                            { error: "field1 too long" },
                            { status: 400 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.error).toBe("field1 too long");
        });
    });

    describe("错误处理测试", () => {
        it("应该处理无效JSON", async () => {
            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(
                        { error: "Invalid JSON" },
                        { status: 400 }
                    );
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: "invalid json",
            });

            expectErrorResponse(response, 400);
        });

        it("应该处理服务器内部错误", async () => {
            server.use(
                http.post("/api/endpoint", () => {
                    // 模拟服务器错误
                    throw new Error("Internal server error");
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(createMockRequestData()),
            });

            expectErrorResponse(response, 500);
        });

        it("应该处理数据库连接错误", async () => {
            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(
                        { error: "Database connection failed" },
                        { status: 503 }
                    );
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(createMockRequestData()),
            });

            expectErrorResponse(response, 503);
            expect(response.data.error).toBe("Database connection failed");
        });
    });

    describe("安全性测试", () => {
        it("应该拒绝未授权请求", async () => {
            server.use(
                http.post("/api/endpoint", ({ request }) => {
                    const authHeader = request.headers.get("authorization");
                    if (!authHeader) {
                        return HttpResponse.json(
                            { error: "Unauthorized" },
                            { status: 401 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(createMockRequestData()),
                // 不包含Authorization头
            });

            expectErrorResponse(response, 401);
            expect(response.data.error).toBe("Unauthorized");
        });

        it("应该验证权限", async () => {
            server.use(
                http.post("/api/endpoint", ({ request }) => {
                    const userRole = request.headers.get("x-user-role");
                    if (userRole !== "admin") {
                        return HttpResponse.json(
                            { error: "Forbidden" },
                            { status: 403 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(createMockRequestData()),
                headers: {
                    "x-user-role": "user", // 非管理员角色
                },
            });

            expectErrorResponse(response, 403);
            expect(response.data.error).toBe("Forbidden");
        });

        it("应该防止SQL注入", async () => {
            const maliciousData = createMockRequestData({
                field1: "'; DROP TABLE users; --",
            });

            server.use(
                http.post("/api/endpoint", async ({ request }) => {
                    const body = await request.json() as any;

                    // 检查是否包含SQL注入特征
                    const sqlInjectionPattern = /['"]*;.*drop/i;
                    if (sqlInjectionPattern.test(body.field1)) {
                        return HttpResponse.json(
                            { error: "Invalid input" },
                            { status: 400 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(maliciousData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.error).toBe("Invalid input");
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内响应", async () => {
            const startTime = performance.now();

            server.use(
                http.post("/api/endpoint", async () => {
                    // 模拟处理时间
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(createMockRequestData()),
            });

            const endTime = performance.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(1000); // 1秒响应时间限制
            expectSuccessResponse(response, 200);
        });

        it("应该处理并发请求", async () => {
            const requestCount = 10;
            const responses = await Promise.all(
                Array.from({ length: requestCount }, () =>
                    apiRequest("/api/endpoint", {
                        method: "POST",
                        body: JSON.stringify(createMockRequestData()),
                    })
                )
            );

            responses.forEach(response => {
                expectSuccessResponse(response, 200);
            });
        });
    });

    describe("边界条件测试", () => {
        it("应该处理空请求体", async () => {
            server.use(
                http.post("/api/endpoint", async ({ request }) => {
                    const body = await request.json().catch(() => null);
                    if (!body || Object.keys(body).length === 0) {
                        return HttpResponse.json(
                            { error: "Request body is required" },
                            { status: 400 }
                        );
                    }

                    return HttpResponse.json(createMockResponseData());
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: "",
            });

            expectErrorResponse(response, 400);
        });

        it("应该处理超大请求体", async () => {
            const largeData = createMockRequestData({
                field1: "x".repeat(1000000), // 1MB数据
            });

            server.use(
                http.post("/api/endpoint", () => {
                    return HttpResponse.json(
                        { error: "Request too large" },
                        { status: 413 }
                    );
                })
            );

            const response = await apiRequest("/api/endpoint", {
                method: "POST",
                body: JSON.stringify(largeData),
            });

            expectErrorResponse(response, 413);
        });
    });
});

// API请求/响应类型定义
interface ApiRequestData {
    field1: string;
    field2: string;
    [key: string]: any;
}

interface ApiResponseData {
    id: string;
    success: boolean;
    [key: string]: any;
}