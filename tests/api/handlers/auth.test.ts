/**
 * 认证API测试
 * 测试认证相关的API端点
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { server } from "../../../vitest.setup";
import { rest } from "msw";
import { apiRequest, authenticatedApiRequest, expectSuccessResponse, expectErrorResponse, createTestUser } from "../setup";

describe("认证API", () => {
    const mockUser = createTestUser({
        id: "test-user-123",
        email: "auth@test.com",
        name: "Auth Test User",
    });

    beforeEach(() => {
        // 每个测试前重置mock
    });

    afterEach(() => {
        // 每个测试后清理
    });

    describe("POST /api/auth/signin", () => {
        it("应该成功登录用户", async () => {
            const loginData = {
                email: "test@example.com",
                password: "password123",
            };

            const response = await apiRequest("/api/auth/signin", {
                method: "POST",
                body: JSON.stringify(loginData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("user");
            expect(response.data.user).toHaveProperty("id");
            expect(response.data.user).toHaveProperty("email");
            expect(response.data.user).toHaveProperty("name");
        });

        it("应该拒绝无效的登录数据", async () => {
            const invalidData = {
                email: "invalid-email",
                password: "123", // 密码太短
            };

            const response = await apiRequest("/api/auth/signin", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝缺少密码的登录请求", async () => {
            const incompleteData = {
                email: "test@example.com",
            };

            const response = await apiRequest("/api/auth/signin", {
                method: "POST",
                body: JSON.stringify(incompleteData),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝缺少邮箱的登录请求", async () => {
            const incompleteData = {
                password: "password123",
            };

            const response = await apiRequest("/api/auth/signin", {
                method: "POST",
                body: JSON.stringify(incompleteData),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝空请求体", async () => {
            const response = await apiRequest("/api/auth/signin", {
                method: "POST",
                body: "",
            });

            expectErrorResponse(response, 400);
        });
    });

    describe("POST /api/auth/signout", () => {
        it("应该成功登出用户", async () => {
            const response = await authenticatedApiRequest("/api/auth/signout", {
                method: "POST",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
        });

        it("应该处理未认证的登出请求", async () => {
            const response = await apiRequest("/api/auth/signout", {
                method: "POST",
            });

            // 根据API设计，可能返回200或401
            expect([200, 401]).toContain(response.status);
        });
    });

    describe("GET /api/auth/me", () => {
        beforeEach(() => {
            // 为/me端点添加mock
            server.use(
                rest.get("/api/auth/me", (req, res, ctx) => {
                    const authHeader = req.headers.get("authorization");
                    if (!authHeader) {
                        return res(
                            ctx.status(401),
                            ctx.json({ error: "Unauthorized" })
                        );
                    }

                    return res(
                        ctx.status(200),
                        ctx.json({
                            user: mockUser,
                        })
                    );
                })
            );
        });

        it("应该返回当前用户信息", async () => {
            const response = await authenticatedApiRequest("/api/auth/me", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("user");
            expect(response.data.user.id).toBe(mockUser.id);
            expect(response.data.user.email).toBe(mockUser.email);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/auth/me", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/auth/register", () => {
        beforeEach(() => {
            // 为注册端点添加mock
            server.use(
                rest.post("/api/auth/register", (req, res, ctx) => {
                    const { email, password, name } = req.body as any;

                    // 基本验证
                    if (!email || !password || !name) {
                        return res(
                            ctx.status(400),
                            ctx.json({ error: "Missing required fields" })
                        );
                    }

                    if (password.length < 8) {
                        return res(
                            ctx.status(400),
                            ctx.json({ error: "Password too short" })
                        );
                    }

                    return res(
                        ctx.status(201),
                        ctx.json({
                            success: true,
                            user: {
                                id: "new-user-id",
                                email,
                                name,
                                role: "user",
                                createdAt: new Date().toISOString(),
                            },
                        })
                    );
                })
            );
        });

        it("应该成功注册新用户", async () => {
            const registerData = {
                email: "newuser@example.com",
                password: "password123",
                name: "New User",
            };

            const response = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(registerData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("user");
            expect(response.data.user.email).toBe(registerData.email);
            expect(response.data.user.name).toBe(registerData.name);
        });

        it("应该拒绝密码太短的注册请求", async () => {
            const invalidData = {
                email: "test@example.com",
                password: "123",
                name: "Test User",
            };

            const response = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
        });

        it("应该拒绝缺少字段的注册请求", async () => {
            const incompleteData = {
                email: "test@example.com",
                // 缺少password和name
            };

            const response = await apiRequest("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(incompleteData),
            });

            expectErrorResponse(response, 400);
        });
    });
});