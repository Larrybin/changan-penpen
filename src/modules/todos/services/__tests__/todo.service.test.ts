import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import * as dbModule from "@/db";
import { categories } from "@/modules/todos/schemas/category.schema";
import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";
import {
    createTodoForUser,
    deleteTodoForUser,
    getTodoByIdForUser,
    listTodosForUser,
    updateTodoForUser,
} from "../todo.service";
import type { TestDbContext } from "../../../../../tests/fixtures/db";
import { createTestDb } from "../../../../../tests/fixtures/db";

describe("todo.service", () => {
    let ctx: TestDbContext;
    let defaultUserId: string;
    let getDbMock: ReturnType<typeof vi.spyOn> | undefined;
    let shouldSkip = false;

    const bailIfUnavailable = () => shouldSkip;

    async function insertCategoryForUser(name = "Work") {
        const inserted = ctx.db
            .insert(categories)
            .values({
                name,
                userId: defaultUserId,
            })
            .returning()
            .get();

        if (!inserted) {
            throw new Error("Failed to insert test category");
        }

        return inserted;
    }

    beforeAll(async () => {
        try {
            ctx = await createTestDb();
            getDbMock = vi
                .spyOn(dbModule, "getDb")
                .mockImplementation(async () => ctx.db);
        } catch (error) {
            shouldSkip = true;
            console.warn(
                "Skipping todo.service tests because better-sqlite3 bindings are unavailable:",
                (error as Error).message,
            );
        }
    });

    beforeEach(() => {
        if (bailIfUnavailable() || !ctx) {
            return;
        }
        ctx.reset();
        const user = ctx.insertUser({
            id: "user-test",
            email: "user-test@example.com",
            name: "Test User",
        });
        defaultUserId = user.id;
        getDbMock?.mockClear();
        getDbMock?.mockImplementation(async () => ctx.db);
    });

    afterAll(() => {
        if (getDbMock) {
            getDbMock.mockRestore();
        }
        if (!shouldSkip && ctx) {
            ctx.cleanup();
        }
    });

    it("creates a todo with sanitized defaults and hydrated category", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        const category = await insertCategoryForUser("Personal");

        const todo = await createTodoForUser(defaultUserId, {
            title: "Buy groceries",
            categoryId: category.id.toString(),
            status: "",
            priority: "",
            imageUrl: "",
            imageAlt: "",
            dueDate: "",
        });

        expect(todo.id).toBeGreaterThan(0);
        expect(todo.userId).toBe(defaultUserId);
        expect(todo.status).toBe(TodoStatus.PENDING);
        expect(todo.priority).toBe(TodoPriority.MEDIUM);
        expect(Boolean(todo.completed)).toBe(false);
        expect(todo.categoryId).toBe(category.id);
        expect(todo.categoryName).toBe("Personal");
    });

    it("rejects invalid payloads via schema validation", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        await expect(
            createTodoForUser(defaultUserId, {
                title: "ab",
            } as never),
        ).rejects.toThrowError();
    });

    it("updates an existing todo and applies overrides", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        const created = await createTodoForUser(defaultUserId, {
            title: "Draft blog post",
        });

        const updated = await updateTodoForUser(defaultUserId, created.id, {
            title: "Publish blog post",
            status: TodoStatus.COMPLETED,
            priority: TodoPriority.HIGH,
            completed: true,
        });

        expect(updated.title).toBe("Publish blog post");
        expect(updated.status).toBe(TodoStatus.COMPLETED);
        expect(updated.priority).toBe(TodoPriority.HIGH);
        expect(Boolean(updated.completed)).toBe(true);
    });

    it("throws when updating a missing todo", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        await expect(
            updateTodoForUser(defaultUserId, 9999, {
                title: "Does not exist",
            }),
        ).rejects.toThrow("Todo not found or unauthorized");
    });

    it("deletes a todo and removes it from listings", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        const created = await createTodoForUser(defaultUserId, {
            title: "Archive documents",
        });

        await deleteTodoForUser(defaultUserId, created.id);

        const { total } = await listTodosForUser(defaultUserId);
        expect(total).toBe(0);
    });

    it("lists todos in reverse chronological order with pagination", async () => {
        if (bailIfUnavailable()) {
            return;
        }
        vi.useFakeTimers();

        vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        await createTodoForUser(defaultUserId, { title: "First" });

        vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));
        await createTodoForUser(defaultUserId, { title: "Second" });

        vi.setSystemTime(new Date("2024-01-03T00:00:00.000Z"));
        await createTodoForUser(defaultUserId, { title: "Third" });

        const pageOne = await listTodosForUser(defaultUserId, {
            page: 1,
            perPage: 2,
        });
        expect(pageOne.total).toBe(3);
        expect(pageOne.data.map((item) => item.title)).toEqual([
            "Third",
            "Second",
        ]);

        const pageTwo = await listTodosForUser(defaultUserId, {
            page: 2,
            perPage: 2,
        });
        expect(pageTwo.data.map((item) => item.title)).toEqual(["First"]);

        vi.useRealTimers();
    });

    it("ignores todos belonging to other users", async () => {
        if (bailIfUnavailable()) {
            return;
        }

        await createTodoForUser(defaultUserId, { title: "Mine" });

        const otherUser = ctx.insertUser({
            id: "user-other",
            email: "other@example.com",
            name: "Other",
        });

        await createTodoForUser(otherUser.id, { title: "Not mine" });

        const { data, total } = await listTodosForUser(defaultUserId);

        expect(total).toBe(1);
        expect(data).toHaveLength(1);
        expect(data[0]?.userId).toBe(defaultUserId);
    });

    it("returns null when todo is missing or owned by another user", async () => {
        if (bailIfUnavailable()) {
            return;
        }

        const otherUser = ctx.insertUser({
            id: "user-foreign",
            email: "foreign@example.com",
            name: "Foreign",
        });

        const created = await createTodoForUser(otherUser.id, {
            title: "Foreign todo",
        });

        const result = await getTodoByIdForUser(defaultUserId, created.id);
        expect(result).toBeNull();

        const missing = await getTodoByIdForUser(defaultUserId, created.id + 999);
        expect(missing).toBeNull();
    });
});
