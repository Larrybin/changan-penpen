import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

vi.mock("@/modules/auth/utils/auth-utils", () => ({
    requireAuth: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
    uploadToR2: vi
        .fn()
        .mockResolvedValue({ success: true, url: "https://example.com" }),
}));

vi.mock("@/modules/todos/services/todo.service", () => ({
    createTodoForUser: vi.fn(),
    updateTodoForUser: vi.fn(),
    deleteTodoForUser: vi.fn(),
    listTodosForUser: vi.fn(),
    getTodoByIdForUser: vi.fn(),
}));

vi.mock("@/modules/todos/services/category.service", () => ({
    createCategoryForUser: vi.fn(),
    listCategoriesForUser: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import {
    createTodoForUser,
    updateTodoForUser,
    deleteTodoForUser,
    listTodosForUser,
    getTodoByIdForUser,
} from "@/modules/todos/services/todo.service";
import {
    createCategoryForUser,
    listCategoriesForUser,
} from "@/modules/todos/services/category.service";
import { createTodoAction } from "../create-todo.action";
import { deleteTodoAction } from "../delete-todo.action";
import { updateTodoAction, updateTodoFieldAction } from "../update-todo.action";
import getAllTodos from "../get-todos.action";
import { getTodoById } from "../get-todo-by-id.action";
import { createCategory } from "../create-category.action";
import { getAllCategories } from "../get-categories.action";

const requireAuthMock = vi.mocked(requireAuth);
const createTodoForUserMock = vi.mocked(createTodoForUser);
const updateTodoForUserMock = vi.mocked(updateTodoForUser);
const deleteTodoForUserMock = vi.mocked(deleteTodoForUser);
const listTodosForUserMock = vi.mocked(listTodosForUser);
const getTodoByIdForUserMock = vi.mocked(getTodoByIdForUser);
const createCategoryForUserMock = vi.mocked(createCategoryForUser);
const listCategoriesForUserMock = vi.mocked(listCategoriesForUser);
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);

const buildFormData = (values: Record<string, string>) => {
    const fd = new FormData();
    for (const [key, value] of Object.entries(values)) {
        fd.append(key, value);
    }
    return fd;
};

describe("todos actions failure paths", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createTodoAction", () => {
        it("surfaces authentication errors", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            await expect(createTodoAction(new FormData())).rejects.toThrow(
                "Authentication required",
            );
            expect(createTodoForUserMock).not.toHaveBeenCalled();
        });

        it("propagates service failures", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            createTodoForUserMock.mockRejectedValueOnce(
                new Error("DB unavailable"),
            );

            const fd = buildFormData({ title: "Test task" });

            await expect(createTodoAction(fd)).rejects.toThrow(
                "DB unavailable",
            );
            expect(createTodoForUserMock).toHaveBeenCalled();
            expect(redirectMock).not.toHaveBeenCalled();
        });

        it("throws validation errors when payload is invalid", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);

            const fd = buildFormData({ title: "ab" });

            await expect(createTodoAction(fd)).rejects.toThrow(
                /title is required/i,
            );
            expect(createTodoForUserMock).not.toHaveBeenCalled();
        });
    });

    describe("updateTodoAction", () => {
        it("surfaces authentication errors", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            await expect(
                updateTodoAction(1, buildFormData({ title: "Updated" })),
            ).rejects.toThrow("Authentication required");
            expect(updateTodoForUserMock).not.toHaveBeenCalled();
        });

        it("propagates service failures", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            updateTodoForUserMock.mockRejectedValueOnce(
                new Error("Todo not found or unauthorized"),
            );

            await expect(
                updateTodoAction(1, buildFormData({ title: "Updated" })),
            ).rejects.toThrow("Todo not found or unauthorized");
            expect(redirectMock).not.toHaveBeenCalled();
        });
    });

    describe("updateTodoFieldAction", () => {
        it("returns auth failure result when authentication fails", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            const result = await updateTodoFieldAction(1, { completed: true });
            expect(result).toEqual({
                success: false,
                error: "Authentication required",
            });
            expect(updateTodoForUserMock).not.toHaveBeenCalled();
        });

        it("returns service error message when update fails", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            updateTodoForUserMock.mockRejectedValueOnce(
                new Error("Update failed"),
            );

            const result = await updateTodoFieldAction(1, { completed: false });
            expect(result).toEqual({ success: false, error: "Update failed" });
        });
    });

    describe("deleteTodoAction", () => {
        it("returns auth failure result when authentication fails", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            const result = await deleteTodoAction(1);
            expect(result).toEqual({
                success: false,
                error: "Authentication required",
            });
            expect(deleteTodoForUserMock).not.toHaveBeenCalled();
        });

        it("returns service error message when deletion fails", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            deleteTodoForUserMock.mockRejectedValueOnce(
                new Error("Deletion failed"),
            );

            const result = await deleteTodoAction(1);
            expect(result).toEqual({
                success: false,
                error: "Deletion failed",
            });
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe("getAllTodos", () => {
        it("returns todos when service succeeds", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            listTodosForUserMock.mockResolvedValueOnce({
                data: [
                    {
                        id: 1,
                        title: "Task",
                        userId: "user-1",
                        categoryId: null,
                        categoryName: null,
                        description: null,
                        imageAlt: null,
                        imageUrl: null,
                        completed: 0,
                        dueDate: null,
                        status: "pending",
                        priority: "medium",
                        createdAt: "2024-01-01T00:00:00.000Z",
                        updatedAt: "2024-01-01T00:00:00.000Z",
                    },
                ],
                total: 1,
            } as never);

            const result = await getAllTodos();
            expect(result).toHaveLength(1);
            expect(listTodosForUserMock).toHaveBeenCalledWith("user-1", {
                page: 1,
                perPage: 100,
            });
        });

        it("returns empty array on error", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            const result = await getAllTodos();
            expect(result).toEqual([]);
            expect(listTodosForUserMock).not.toHaveBeenCalled();
        });
    });

    describe("getTodoById", () => {
        it("returns todo when found", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            getTodoByIdForUserMock.mockResolvedValueOnce({
                id: 10,
                title: "Read",
                userId: "user-1",
                categoryId: null,
                categoryName: null,
                description: null,
                imageAlt: null,
                imageUrl: null,
                completed: 0,
                dueDate: null,
                status: "pending",
                priority: "medium",
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
            } as never);

            const result = await getTodoById(10);
            expect(result?.id).toBe(10);
            expect(getTodoByIdForUserMock).toHaveBeenCalledWith("user-1", 10);
        });

        it("returns null when service returns null", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            getTodoByIdForUserMock.mockResolvedValueOnce(null);

            const result = await getTodoById(42);
            expect(result).toBeNull();
        });

        it("returns null on authentication error", async () => {
            requireAuthMock.mockRejectedValueOnce(
                new Error("Authentication required"),
            );

            const result = await getTodoById(42);
            expect(result).toBeNull();
            expect(getTodoByIdForUserMock).not.toHaveBeenCalled();
        });
    });

    describe("createCategory", () => {
        it("creates a category and revalidates paths", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            createCategoryForUserMock.mockResolvedValueOnce({
                id: 1,
                name: "Work",
                userId: "user-1",
                color: "#000000",
                description: null,
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
            } as never);

            const result = await createCategory({ name: "Work" });
            expect(result.name).toBe("Work");
            expect(createCategoryForUserMock).toHaveBeenCalledWith("user-1", {
                name: "Work",
                description: undefined,
                color: undefined,
            });
            expect(revalidatePathMock).toHaveBeenCalledTimes(2);
        });

        it("omits optional fields that are blank strings", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            createCategoryForUserMock.mockResolvedValueOnce({
                id: 2,
                name: "Work",
                userId: "user-1",
                color: "#6366f1",
                description: null,
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z",
            } as never);

            await createCategory({
                name: "Work",
                description: "   ",
                color: "",
            });

            expect(createCategoryForUserMock).toHaveBeenCalledWith("user-1", {
                name: "Work",
                description: undefined,
                color: undefined,
            });
        });

        it("throws when name is missing", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);

            await expect(createCategory({ name: "" })).rejects.toThrow(
                "Category name is required",
            );
            expect(createCategoryForUserMock).not.toHaveBeenCalled();
        });

        it("propagates authentication error", async () => {
            requireAuthMock.mockRejectedValueOnce(new Error("Authentication required"));

            await expect(createCategory({ name: "Work" })).rejects.toThrow(
                "Authentication required",
            );
            expect(createCategoryForUserMock).not.toHaveBeenCalled();
        });

        it("propagates service error", async () => {
            requireAuthMock.mockResolvedValue({ id: "user-1" } as never);
            createCategoryForUserMock.mockRejectedValueOnce(new Error("DB failure"));

            await expect(createCategory({ name: "Work" })).rejects.toThrow(
                "DB failure",
            );
            expect(revalidatePathMock).not.toHaveBeenCalled();
        });
    });

    describe("getAllCategories", () => {
        it("returns categories from service", async () => {
            listCategoriesForUserMock.mockResolvedValueOnce([
                {
                    id: 1,
                    name: "Work",
                    userId: "user-1",
                    color: "#000000",
                    description: null,
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-01T00:00:00.000Z",
                },
            ] as never);

            const result = await getAllCategories("user-1");
            expect(result).toHaveLength(1);
            expect(listCategoriesForUserMock).toHaveBeenCalledWith("user-1");
        });

        it("returns empty array on error", async () => {
            listCategoriesForUserMock.mockRejectedValueOnce(new Error("DB failure"));

            const result = await getAllCategories("user-1");
            expect(result).toEqual([]);
        });
    });
});
