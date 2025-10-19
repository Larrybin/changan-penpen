/**
 * 管理员API测试
 * 测试管理员相关的API端点
 */

import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../../vitest.setup";
import { rest } from "msw";
import { apiRequest, authenticatedApiRequest, expectSuccessResponse, expectErrorResponse, createTestUser, createTestProduct } from "../setup";

describe("管理员API", () => {
    const mockAdmin = createTestUser({
        id: "admin-123",
        email: "admin@test.com",
        role: "admin",
    });

    const mockUsers = [
        createTestUser({ id: "1", email: "user1@test.com", name: "User 1" }),
        createTestUser({ id: "2", email: "user2@test.com", name: "User 2" }),
        createTestUser({ id: "3", email: "user3@test.com", name: "User 3" }),
    ];

    const mockProducts = [
        createTestProduct({ id: "1", name: "Product 1", price: 99.99 }),
        createTestProduct({ id: "2", name: "Product 2", price: 149.99 }),
        createTestProduct({ id: "3", name: "Product 3", price: 199.99 }),
    ];

    beforeEach(() => {
        // 设置管理员权限mock
        server.use(
            rest.get("/api/admin/users", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                // 模拟权限检查
                const userRole = "admin"; // 在实际应用中从token解析
                if (userRole !== "admin") {
                    return res(
                        ctx.status(403),
                        ctx.json({ error: "Forbidden" })
                    );
                }

                const page = req.url.searchParams.get("page") || "1";
                const limit = req.url.searchParams.get("limit") || "10";
                const search = req.url.searchParams.get("search") || "";

                let filteredUsers = mockUsers;
                if (search) {
                    filteredUsers = mockUsers.filter(user =>
                        user.name.toLowerCase().includes(search.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.toLowerCase())
                    );
                }

                const pageNum = parseInt(page);
                const limitNum = parseInt(limit);
                const startIndex = (pageNum - 1) * limitNum;
                const endIndex = startIndex + limitNum;

                return res(
                    ctx.status(200),
                    ctx.json({
                        users: filteredUsers.slice(startIndex, endIndex),
                        total: filteredUsers.length,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(filteredUsers.length / limitNum),
                    })
                );
            })
        );
    });

    describe("GET /api/admin/users", () => {
        it("应该返回用户列表", async () => {
            const response = await authenticatedApiRequest("/api/admin/users", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("users");
            expect(response.data).toHaveProperty("total");
            expect(response.data).toHaveProperty("page");
            expect(response.data).toHaveProperty("limit");
            expect(response.data).toHaveProperty("totalPages");
            expect(Array.isArray(response.data.users)).toBe(true);
            expect(response.data.users.length).toBeGreaterThan(0);
        });

        it("应该支持分页", async () => {
            const response = await authenticatedApiRequest("/api/admin/users?page=1&limit=2", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.users.length).toBeLessThanOrEqual(2);
            expect(response.data.page).toBe(1);
            expect(response.data.limit).toBe(2);
        });

        it("应该支持搜索功能", async () => {
            const response = await authenticatedApiRequest("/api/admin/users?search=user1", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.users.length).toBe(1);
            expect(response.data.users[0].email).toBe("user1@test.com");
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/admin/users", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/admin/users", () => {
        beforeEach(() => {
            server.use(
                rest.post("/api/admin/users", (req, res, ctx) => {
                    const authHeader = req.headers.get("authorization");
                    if (!authHeader) {
                        return res(
                            ctx.status(401),
                            ctx.json({ error: "Unauthorized" })
                        );
                    }

                    const userData = req.body as any;
                    if (!userData.email || !userData.name) {
                        return res(
                            ctx.status(400),
                            ctx.json({ error: "Missing required fields" })
                        );
                    }

                    const newUser = createTestUser({
                        id: "new-user-" + Date.now(),
                        email: userData.email,
                        name: userData.name,
                        role: userData.role || "user",
                    });

                    return res(
                        ctx.status(201),
                        ctx.json({
                            success: true,
                            user: newUser,
                        })
                    );
                })
            );
        });

        it("应该创建新用户", async () => {
            const newUserData = {
                email: "newadmin@example.com",
                name: "New Admin User",
                role: "admin",
            };

            const response = await authenticatedApiRequest("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(newUserData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("user");
            expect(response.data.user.email).toBe(newUserData.email);
            expect(response.data.user.name).toBe(newUserData.name);
        });

        it("应该拒绝缺少必需字段的请求", async () => {
            const incompleteData = {
                name: "Incomplete User",
            };

            const response = await authenticatedApiRequest("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(incompleteData),
            });

            expectErrorResponse(response, 400);
        });
    });

    describe("PUT /api/admin/users/:id", () => {
        beforeEach(() => {
            server.use(
                rest.put("/api/admin/users/:id", (req, res, ctx) => {
                    const authHeader = req.headers.get("authorization");
                    if (!authHeader) {
                        return res(
                            ctx.status(401),
                            ctx.json({ error: "Unauthorized" })
                        );
                    }

                    const userId = req.params.id as string;
                    const userData = req.body as any;

                    const existingUser = mockUsers.find(u => u.id === userId);
                    if (!existingUser) {
                        return res(
                            ctx.status(404),
                            ctx.json({ error: "User not found" })
                        );
                    }

                    const updatedUser = {
                        ...existingUser,
                        ...userData,
                        updatedAt: new Date().toISOString(),
                    };

                    return res(
                        ctx.status(200),
                        ctx.json({
                            success: true,
                            user: updatedUser,
                        })
                    );
                })
            );
        });

        it("应该更新用户信息", async () => {
            const updateData = {
                name: "Updated User Name",
                role: "admin",
            };

            const response = await authenticatedApiRequest("/api/admin/users/1", {
                method: "PUT",
                body: JSON.stringify(updateData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data.user.name).toBe(updateData.name);
            expect(response.data.user.role).toBe(updateData.role);
        });

        it("应该返回404当用户不存在", async () => {
            const updateData = {
                name: "Updated Name",
            };

            const response = await authenticatedApiRequest("/api/admin/users/999", {
                method: "PUT",
                body: JSON.stringify(updateData),
            });

            expectErrorResponse(response, 404);
        });
    });

    describe("DELETE /api/admin/users/:id", () => {
        beforeEach(() => {
            server.use(
                rest.delete("/api/admin/users/:id", (req, res, ctx) => {
                    const authHeader = req.headers.get("authorization");
                    if (!authHeader) {
                        return res(
                            ctx.status(401),
                            ctx.json({ error: "Unauthorized" })
                        );
                    }

                    const userId = req.params.id as string;
                    const existingUser = mockUsers.find(u => u.id === userId);
                    if (!existingUser) {
                        return res(
                            ctx.status(404),
                            ctx.json({ error: "User not found" })
                        );
                    }

                    return res(
                        ctx.status(200),
                        ctx.json({
                            success: true,
                            message: "User deleted successfully",
                        })
                    );
                })
            );
        });

        it("应该删除用户", async () => {
            const response = await authenticatedApiRequest("/api/admin/users/1", {
                method: "DELETE",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
            expect(response.data).toHaveProperty("message");
        });

        it("应该返回404当用户不存在", async () => {
            const response = await authenticatedApiRequest("/api/admin/users/999", {
                method: "DELETE",
            });

            expectErrorResponse(response, 404);
        });
    });
});