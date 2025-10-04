import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { categories, getDb, user } from "@/db";
import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";
import {
    insertTodoSchema,
    todos,
    updateTodoSchema,
} from "@/modules/todos/schemas/todo.schema";
import type { Category } from "@/modules/todos/schemas/category.schema";

const createTodoForUserSchema = insertTodoSchema.omit({ userId: true });
const updateTodoForUserSchema = updateTodoSchema;

export type TodoCreateInput = z.input<typeof createTodoForUserSchema>;
export type TodoUpdateInput = z.input<typeof updateTodoForUserSchema>;
export type TodoWithCategory = z.infer<typeof createTodoForUserSchema> & {
    id: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    categoryName: Category["name"] | null;
};

export type AdminTodoRecord = TodoWithCategory & {
    userEmail: string | null;
};

interface PaginationParams {
    page?: number;
    perPage?: number;
}

export interface ListTodosForAdminOptions extends PaginationParams {
    tenantId?: string;
}

const defaultPagination: Required<PaginationParams> = {
    page: 1,
    perPage: 20,
};

const todoSelection = {
    id: todos.id,
    title: todos.title,
    description: todos.description,
    completed: todos.completed,
    categoryId: todos.categoryId,
    categoryName: categories.name,
    dueDate: todos.dueDate,
    imageUrl: todos.imageUrl,
    imageAlt: todos.imageAlt,
    status: todos.status,
    priority: todos.priority,
    userId: todos.userId,
    createdAt: todos.createdAt,
    updatedAt: todos.updatedAt,
};

const adminTodoSelection = {
    ...todoSelection,
    userEmail: user.email,
};

function normalizeTodoPayload<T extends Record<string, unknown>>(
    payload: T,
    applyDefaults = false,
) {
    const sanitized: Record<string, unknown> = { ...payload };

    if (sanitized.dueDate === "" || sanitized.dueDate === null) {
        sanitized.dueDate = undefined;
    }

    if (sanitized.imageUrl === "") {
        sanitized.imageUrl = undefined;
    }

    if (sanitized.imageAlt === "") {
        sanitized.imageAlt = undefined;
    }

    const categoryId = sanitized.categoryId;
    if (typeof categoryId === "string") {
        const parsed = Number.parseInt(categoryId, 10);
        sanitized.categoryId = Number.isNaN(parsed) ? undefined : parsed;
    }

    if (applyDefaults) {
        if (sanitized.status === undefined || sanitized.status === "") {
            sanitized.status = TodoStatus.PENDING;
        }

        if (sanitized.priority === undefined || sanitized.priority === "") {
            sanitized.priority = TodoPriority.MEDIUM;
        }
    }

    return sanitized as T;
}

export async function listTodosForUser(
    userId: string,
    pagination?: PaginationParams,
): Promise<{ data: TodoWithCategory[]; total: number }>;
export async function listTodosForUser(
    userId: string,
    pagination: PaginationParams = defaultPagination,
): Promise<{ data: TodoWithCategory[]; total: number }>;
export async function listTodosForUser(
    userId: string,
    pagination: PaginationParams = defaultPagination,
): Promise<{ data: TodoWithCategory[]; total: number }> {
    const { page, perPage } = {
        ...defaultPagination,
        ...pagination,
    };

    const db = await getDb();

    const [data, totalResult] = await Promise.all([
        db
            .select(todoSelection)
            .from(todos)
            .leftJoin(
                categories,
                and(
                    eq(todos.categoryId, categories.id),
                    eq(categories.userId, userId),
                ),
            )
            .where(eq(todos.userId, userId))
            .orderBy(desc(todos.createdAt))
            .limit(perPage)
            .offset((page - 1) * perPage),
        db
            .select({ value: sql<number>`count(*)` })
            .from(todos)
            .where(eq(todos.userId, userId)),
    ]);

    return {
        data,
        total: totalResult[0]?.value ?? 0,
    };
}

export async function getTodoByIdForUser(
    userId: string,
    todoId: number,
): Promise<TodoWithCategory | null> {
    const db = await getDb();

    const result = await db
        .select(todoSelection)
        .from(todos)
        .leftJoin(
            categories,
            and(
                eq(todos.categoryId, categories.id),
                eq(categories.userId, userId),
            ),
        )
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
        .limit(1);

    return result[0] ?? null;
}

export async function createTodoForUser(
    userId: string,
    input: TodoCreateInput,
): Promise<TodoWithCategory> {
    const db = await getDb();
    const parsed = createTodoForUserSchema.parse(
        normalizeTodoPayload({ ...input }, true),
    );
    const now = new Date().toISOString();

    const created = await db
        .insert(todos)
        .values({
            ...parsed,
            userId,
            status: parsed.status ?? TodoStatus.PENDING,
            priority: parsed.priority ?? TodoPriority.MEDIUM,
            createdAt: now,
            updatedAt: now,
        })
        .returning({ id: todos.id });

    const todoId = created[0]?.id;

    if (!todoId) {
        throw new Error("Failed to create todo");
    }

    const todo = await getTodoByIdForUser(userId, todoId);

    if (!todo) {
        throw new Error("Failed to load created todo");
    }

    return todo;
}

export async function updateTodoForUser(
    userId: string,
    todoId: number,
    input: TodoUpdateInput,
): Promise<TodoWithCategory> {
    const db = await getDb();

    const parsed = updateTodoForUserSchema.parse(
        normalizeTodoPayload({ ...input }),
    );

    const result = await db
        .update(todos)
        .set({
            ...parsed,
            updatedAt: new Date().toISOString(),
        })
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
        .returning({ id: todos.id });

    const id = result[0]?.id;

    if (!id) {
        throw new Error("Todo not found or unauthorized");
    }

    const todo = await getTodoByIdForUser(userId, id);

    if (!todo) {
        throw new Error("Failed to load updated todo");
    }

    return todo;
}

export async function deleteTodoForUser(
    userId: string,
    todoId: number,
): Promise<void> {
    const db = await getDb();

    const existing = await db
        .select({ id: todos.id })
        .from(todos)
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
        .limit(1);

    if (!existing.length) {
        throw new Error("Todo not found or unauthorized");
    }

    await db
        .delete(todos)
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId)));
}

export async function listTodosForAdmin(
    options: ListTodosForAdminOptions = {},
): Promise<{ data: AdminTodoRecord[]; total: number }> {
    const db = await getDb();
    const { page, perPage, tenantId } = {
        ...defaultPagination,
        ...options,
    };

    const baseQuery = db
        .select(adminTodoSelection)
        .from(todos)
        .leftJoin(categories, eq(todos.categoryId, categories.id))
        .leftJoin(user, eq(todos.userId, user.id))
        .orderBy(desc(todos.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage);

    const whereClause = tenantId ? eq(todos.userId, tenantId) : undefined;

    const [rows, totalResult] = await Promise.all([
        whereClause ? baseQuery.where(whereClause) : baseQuery,
        whereClause
            ? db
                  .select({ value: sql<number>`count(*)` })
                  .from(todos)
                  .where(whereClause)
            : db.select({ value: sql<number>`count(*)` }).from(todos),
    ]);

    return {
        data: rows as AdminTodoRecord[],
        total: totalResult[0]?.value ?? 0,
    };
}

export async function getTodoByIdForAdmin(
    todoId: number,
): Promise<AdminTodoRecord | null> {
    const db = await getDb();
    const rows = await db
        .select(adminTodoSelection)
        .from(todos)
        .leftJoin(categories, eq(todos.categoryId, categories.id))
        .leftJoin(user, eq(todos.userId, user.id))
        .where(eq(todos.id, todoId))
        .limit(1);

    return (rows[0] as AdminTodoRecord | undefined) ?? null;
}

export async function createTodoForTenant(
    tenantId: string,
    input: TodoCreateInput,
): Promise<AdminTodoRecord> {
    const created = await createTodoForUser(tenantId, input);
    const record = await getTodoByIdForAdmin(created.id);

    if (!record) {
        throw new Error("Failed to load created todo");
    }

    return record;
}

export async function updateTodoForAdmin(
    todoId: number,
    input: TodoUpdateInput,
): Promise<AdminTodoRecord> {
    const existing = await getTodoByIdForAdmin(todoId);

    if (!existing) {
        throw new Error("Todo not found");
    }

    await updateTodoForUser(existing.userId, todoId, input);

    const updated = await getTodoByIdForAdmin(todoId);

    if (!updated) {
        throw new Error("Failed to load updated todo");
    }

    return updated;
}

export async function deleteTodoForAdmin(todoId: number) {
    const existing = await getTodoByIdForAdmin(todoId);

    if (!existing) {
        throw new Error("Todo not found");
    }

    await deleteTodoForUser(existing.userId, todoId);
}
