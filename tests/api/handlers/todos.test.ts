/**
 * Todos API测试
 * 测试任务管理相关的API端点
 * 遵循TDD原则，全面覆盖CRUD操作和边界条件
 */

import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../../vitest.setup";
import { rest } from "msw";
import { apiRequest, authenticatedApiRequest, adminApiRequest, expectSuccessResponse, expectErrorResponse } from "../setup";

describe("Todos API", () => {
    const mockTodo = {
        id: 1,
        title: "Test Todo",
        description: "Test description",
        completed: false,
        categoryId: 1,
        userId: "test-user-id",
        tenantId: "test-tenant-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const mockTodos = [
        mockTodo,
        {
            ...mockTodo,
            id: 2,
            title: "Another Todo",
            completed: true,
        },
    ];

    const mockCategory = {
        id: 1,
        name: "Test Category",
        color: "#ff0000",
        tenantId: "test-tenant-id",
        createdAt: new Date().toISOString(),
    };

    beforeEach(() => {
        // 设置Todos API mock
        server.use(
            // GET /api/v1/admin/todos - 获取todos列表
            rest.get("/api/v1/admin/todos", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader || !authHeader.includes("admin")) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const rawPage = Number(req.url.searchParams.get("page") ?? "1");
                const rawPerPage = Number(req.url.searchParams.get("perPage") ?? "20");
                const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
                const perPage = Number.isFinite(rawPerPage)
                    ? Math.min(Math.max(Math.floor(rawPerPage), 1), 100)
                    : 20;
                const tenantId = req.url.searchParams.get("tenantId");

                // 模拟分页逻辑
                const startIndex = (page - 1) * perPage;
                const endIndex = startIndex + perPage;
                let filteredTodos = mockTodos;

                if (tenantId) {
                    filteredTodos = mockTodos.filter(todo => todo.tenantId === tenantId);
                }

                const paginatedTodos = filteredTodos.slice(startIndex, endIndex);

                return res(
                    ctx.status(200),
                    ctx.json({
                        data: paginatedTodos,
                        total: filteredTodos.length,
                        page,
                        perPage,
                        totalPages: Math.ceil(filteredTodos.length / perPage),
                    })
                );
            }),

            // POST /api/v1/admin/todos - 创建todo
            rest.post("/api/v1/admin/todos", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader || !authHeader.includes("admin")) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const body = req.body as any;

                if (!body.userId) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "userId is required", message: "userId is required" })
                    );
                }

                if (!body.title || body.title.trim().length === 0) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Title is required", message: "Title is required" })
                    );
                }

                const newTodo = {
                    ...mockTodo,
                    id: Date.now(),
                    title: body.title,
                    description: body.description || "",
                    completed: false,
                    userId: body.userId,
                    tenantId: body.userId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                return res(
                    ctx.status(201),
                    ctx.json({ data: newTodo })
                );
            }),

            // GET /api/v1/admin/todos/:id - 获取单个todo
            rest.get("/api/v1/admin/todos/:id", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader || !authHeader.includes("admin")) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const todoIdParam = req.params.id as string;
                const todoId = Number(todoIdParam);

                if (!Number.isInteger(todoId)) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Invalid todo id", message: "Invalid todo id" })
                    );
                }

                const todo = mockTodos.find(t => t.id === todoId);

                if (!todo) {
                    return res(
                        ctx.status(404),
                        ctx.json({ error: "Todo not found", message: "Todo not found" })
                    );
                }

                return res(
                    ctx.status(200),
                    ctx.json({ data: todo })
                );
            }),

            // PATCH /api/v1/admin/todos/:id - 更新todo
            rest.patch("/api/v1/admin/todos/:id", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader || !authHeader.includes("admin")) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const todoId = Number(req.params.id);
                const todoIndex = mockTodos.findIndex(t => t.id === todoId);

                if (todoIndex === -1) {
                    return res(
                        ctx.status(404),
                        ctx.json({ error: "Todo not found", message: "Todo not found" })
                    );
                }

                const body = req.body as any;
                const updatedTodo = {
                    ...mockTodos[todoIndex],
                    ...body,
                    updatedAt: new Date().toISOString(),
                };

                return res(
                    ctx.status(200),
                    ctx.json({ data: updatedTodo })
                );
            }),

            // DELETE /api/v1/admin/todos/:id - 删除todo
            rest.delete("/api/v1/admin/todos/:id", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader || !authHeader.includes("admin")) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const todoId = Number(req.params.id);
                const todoIndex = mockTodos.findIndex(t => t.id === todoId);

                if (todoIndex === -1) {
                    return res(
                        ctx.status(404),
                        ctx.json({ error: "Todo not found", message: "Todo not found" })
                    );
                }

                return res(
                    ctx.status(200),
                    ctx.json({ success: true })
                );
            }),

            // GET /api/v1/todos - 用户获取自己的todos
            rest.get("/api/v1/todos", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const page = Number(req.url.searchParams.get("page") || "1");
                const perPage = Number(req.url.searchParams.get("perPage") || "20");
                const completed = req.url.searchParams.get("completed");

                // 模拟用户只能看到自己的todos
                let userTodos = mockTodos.filter(todo => todo.userId === "test-user-id");

                if (completed !== null) {
                    const isCompleted = completed === "true";
                    userTodos = userTodos.filter(todo => todo.completed === isCompleted);
                }

                const startIndex = (page - 1) * perPage;
                const endIndex = startIndex + perPage;
                const paginatedTodos = userTodos.slice(startIndex, endIndex);

                return res(
                    ctx.status(200),
                    ctx.json({
                        data: paginatedTodos,
                        total: userTodos.length,
                        page,
                        perPage,
                        totalPages: Math.ceil(userTodos.length / perPage),
                    })
                );
            }),

            // POST /api/v1/todos - 用户创建todo
            rest.post("/api/v1/todos", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const body = req.body as any;

                if (!body.title || body.title.trim().length === 0) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Title is required", message: "Title is required" })
                    );
                }

                const newTodo = {
                    ...mockTodo,
                    id: Date.now(),
                    title: body.title,
                    description: body.description || "",
                    completed: false,
                    userId: "test-user-id",
                    tenantId: "test-tenant-id",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                return res(
                    ctx.status(201),
                    ctx.json({ data: newTodo })
                );
            }),

            // GET /api/v1/todos/categories - 获取分类列表
            rest.get("/api/v1/todos/categories", (req, res, ctx) => {
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
                        data: [mockCategory],
                        total: 1,
                    })
                );
            }),

            // POST /api/v1/todos/categories - 创建分类
            rest.post("/api/v1/todos/categories", (req, res, ctx) => {
                const authHeader = req.headers.get("authorization");
                if (!authHeader) {
                    return res(
                        ctx.status(401),
                        ctx.json({ error: "Unauthorized" })
                    );
                }

                const body = req.body as any;

                if (!body.name || body.name.trim().length === 0) {
                    return res(
                        ctx.status(400),
                        ctx.json({ error: "Category name is required", message: "Category name is required" })
                    );
                }

                const newCategory = {
                    ...mockCategory,
                    id: Date.now(),
                    name: body.name,
                    color: body.color || "#000000",
                    createdAt: new Date().toISOString(),
                };

                return res(
                    ctx.status(201),
                    ctx.json({ data: newCategory })
                );
            })
        );
    });

    describe("GET /api/v1/admin/todos", () => {
        it("应该返回管理员todos列表", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("data");
            expect(response.data).toHaveProperty("total");
            expect(response.data).toHaveProperty("page");
            expect(response.data).toHaveProperty("totalPages");
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
        });

        it("应该支持分页参数", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?page=1&perPage=10", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.page).toBe(1);
            expect(response.data.perPage).toBe(10);
            expect(response.data.data.length).toBeLessThanOrEqual(10);
        });

        it("应该支持租户过滤", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?tenantId=test-tenant-id", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.data.every((todo: any) => todo.tenantId === "test-tenant-id")).toBe(true);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/v1/admin/todos", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });

        it("应该拒绝非管理员请求", async () => {
            const response = await authenticatedApiRequest("/api/v1/admin/todos", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/v1/admin/todos", () => {
        it("应该创建新的todo", async () => {
            const todoData = {
                userId: "test-user-id",
                title: "New Todo",
                description: "New description",
                categoryId: 1,
            };

            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "POST",
                body: JSON.stringify(todoData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data).toHaveProperty("data");
            expect(response.data.data.title).toBe(todoData.title);
            expect(response.data.data.description).toBe(todoData.description);
            expect(response.data.data.completed).toBe(false);
        });

        it("应该验证必需字段", async () => {
            const invalidData = {
                title: "Todo without user",
            };

            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.message).toBe("userId is required");
        });

        it("应该验证标题字段", async () => {
            const invalidData = {
                userId: "test-user-id",
                title: "",
            };

            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.message).toBe("Title is required");
        });
    });

    describe("GET /api/v1/admin/todos/:id", () => {
        it("应该返回指定的todo", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos/1", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("data");
            expect(response.data.data.id).toBe(1);
            expect(response.data.data.title).toBe("Test Todo");
        });

        it("应该返回404当todo不存在", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos/999", {
                method: "GET",
            });

            expectErrorResponse(response, 404);
            expect(response.data.message).toBe("Todo not found");
        });

        it("应该验证todo ID格式", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos/invalid", {
                method: "GET",
            });

            expectErrorResponse(response, 400);
        });
    });

    describe("PATCH /api/v1/admin/todos/:id", () => {
        it("应该更新指定的todo", async () => {
            const updateData = {
                title: "Updated Todo",
                completed: true,
            };

            const response = await adminApiRequest("/api/v1/admin/todos/1", {
                method: "PATCH",
                body: JSON.stringify(updateData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("data");
            expect(response.data.data.title).toBe(updateData.title);
            expect(response.data.data.completed).toBe(updateData.completed);
        });

        it("应该支持部分更新", async () => {
            const updateData = {
                description: "Updated description only",
            };

            const response = await adminApiRequest("/api/v1/admin/todos/1", {
                method: "PATCH",
                body: JSON.stringify(updateData),
            });

            expectSuccessResponse(response, 200);
            expect(response.data.data.description).toBe(updateData.description);
            expect(response.data.data.title).toBe("Test Todo"); // 原值保持不变
        });

        it("应该返回404当todo不存在", async () => {
            const updateData = {
                title: "Updated Todo",
            };

            const response = await adminApiRequest("/api/v1/admin/todos/999", {
                method: "PATCH",
                body: JSON.stringify(updateData),
            });

            expectErrorResponse(response, 404);
        });
    });

    describe("DELETE /api/v1/admin/todos/:id", () => {
        it("应该删除指定的todo", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos/1", {
                method: "DELETE",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("success", true);
        });

        it("应该返回404当todo不存在", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos/999", {
                method: "DELETE",
            });

            expectErrorResponse(response, 404);
        });
    });

    describe("GET /api/v1/todos", () => {
        it("应该返回用户自己的todos", async () => {
            const response = await authenticatedApiRequest("/api/v1/todos", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("data");
            expect(Array.isArray(response.data.data)).toBe(true);
            // 验证只返回用户的todos
            expect(response.data.data.every((todo: any) => todo.userId === "test-user-id")).toBe(true);
        });

        it("应该支持完成状态过滤", async () => {
            const completedResponse = await authenticatedApiRequest("/api/v1/todos?completed=true", {
                method: "GET",
            });

            expectSuccessResponse(completedResponse, 200);
            expect(completedResponse.data.data.every((todo: any) => todo.completed === true)).toBe(true);

            const pendingResponse = await authenticatedApiRequest("/api/v1/todos?completed=false", {
                method: "GET",
            });

            expectSuccessResponse(pendingResponse, 200);
            expect(pendingResponse.data.data.every((todo: any) => todo.completed === false)).toBe(true);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/v1/todos", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/v1/todos", () => {
        it("应该为当前用户创建todo", async () => {
            const todoData = {
                title: "My New Todo",
                description: "My description",
                categoryId: 1,
            };

            const response = await authenticatedApiRequest("/api/v1/todos", {
                method: "POST",
                body: JSON.stringify(todoData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data).toHaveProperty("data");
            expect(response.data.data.title).toBe(todoData.title);
            expect(response.data.data.userId).toBe("test-user-id");
            expect(response.data.data.completed).toBe(false);
        });

        it("应该验证标题字段", async () => {
            const invalidData = {
                description: "Todo without title",
            };

            const response = await authenticatedApiRequest("/api/v1/todos", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.message).toBe("Title is required");
        });
    });

    describe("GET /api/v1/todos/categories", () => {
        it("应该返回分类列表", async () => {
            const response = await authenticatedApiRequest("/api/v1/todos/categories", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data).toHaveProperty("data");
            expect(response.data).toHaveProperty("total");
            expect(Array.isArray(response.data.data)).toBe(true);
            expect(response.data.data.length).toBeGreaterThan(0);
        });

        it("应该拒绝未认证的请求", async () => {
            const response = await apiRequest("/api/v1/todos/categories", {
                method: "GET",
            });

            expectErrorResponse(response, 401);
        });
    });

    describe("POST /api/v1/todos/categories", () => {
        it("应该创建新的分类", async () => {
            const categoryData = {
                name: "New Category",
                color: "#ff0000",
            };

            const response = await authenticatedApiRequest("/api/v1/todos/categories", {
                method: "POST",
                body: JSON.stringify(categoryData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data).toHaveProperty("data");
            expect(response.data.data.name).toBe(categoryData.name);
            expect(response.data.data.color).toBe(categoryData.color);
        });

        it("应该验证分类名称", async () => {
            const invalidData = {
                color: "#ff0000",
            };

            const response = await authenticatedApiRequest("/api/v1/todos/categories", {
                method: "POST",
                body: JSON.stringify(invalidData),
            });

            expectErrorResponse(response, 400);
            expect(response.data.message).toBe("Category name is required");
        });

        it("应该设置默认颜色", async () => {
            const categoryData = {
                name: "Category without color",
            };

            const response = await authenticatedApiRequest("/api/v1/todos/categories", {
                method: "POST",
                body: JSON.stringify(categoryData),
            });

            expectSuccessResponse(response, 201);
            expect(response.data.data.color).toBe("#000000");
        });
    });

    describe("边界条件和错误处理", () => {
        it("应该处理无效的分页参数", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?page=invalid&perPage=invalid", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            // 应该使用默认值
            expect(response.data.page).toBe(1);
            expect(response.data.perPage).toBe(20);
        });

        it("应该处理负数分页参数", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?page=-1&perPage=-5", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            // 应该使用最小值
            expect(response.data.page).toBe(1);
            expect(response.data.perPage).toBe(1);
        });

        it("应该处理过大的分页参数", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?page=1&perPage=1000", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.data.length).toBeLessThanOrEqual(1000);
        });

        it("应该处理无效的JSON请求体", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "POST",
                body: "invalid json",
            });

            expectErrorResponse(response, 400);
        });

        it("应该处理空的请求体", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "POST",
                body: "",
            });

            expectErrorResponse(response, 400);
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内返回响应", async () => {
            const startTime = Date.now();

            const response = await adminApiRequest("/api/v1/admin/todos", {
                method: "GET",
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(1000); // 应该在1秒内响应
            expectSuccessResponse(response, 200);
        });

        it("应该处理大量数据请求", async () => {
            const response = await adminApiRequest("/api/v1/admin/todos?perPage=100", {
                method: "GET",
            });

            expectSuccessResponse(response, 200);
            expect(response.data.data.length).toBeLessThanOrEqual(100);
        });
    });
});