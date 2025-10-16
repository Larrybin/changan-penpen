import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import "@/lib/openapi/extend";
import { TODO_VALIDATION_MESSAGES } from "@/constants/validation.constant";
import { user } from "@/modules/auth/schemas/auth.schema";
import {
    TodoPriority,
    type TodoPriorityType,
    TodoStatus,
    type TodoStatusType,
} from "@/modules/todos/models/todo.enum";
import { categories } from "./category.schema";

export const todos = sqliteTable("todos", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    categoryId: integer("category_id").references(() => categories.id),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    status: text("status")
        .$type<TodoStatusType>()
        .notNull()
        .default(TodoStatus.PENDING),
    priority: text("priority")
        .$type<TodoPriorityType>()
        .notNull()
        .default(TodoPriority.MEDIUM),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    completed: integer("completed", { mode: "boolean" })
        .notNull()
        .default(false),
    dueDate: text("due_date"), // ISO string
    createdAt: text("created_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
        .notNull()
        .$defaultFn(() => new Date().toISOString()),
});

// Zod schemas for validation
export const insertTodoSchema = createInsertSchema(todos, {
    title: z
        .string()
        .min(3, TODO_VALIDATION_MESSAGES.TITLE_REQUIRED)
        .max(255, TODO_VALIDATION_MESSAGES.TITLE_TOO_LONG)
        .openapi({ description: "任务标题", example: "完成 Swagger 接入" }),
    description: z
        .string()
        .max(1000, TODO_VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG)
        .optional()
        .openapi({ description: "任务描述", example: "补充自动化 API 文档" }),
    categoryId: z.number().optional().openapi({ description: "分类 ID，可选" }),
    userId: z
        .string()
        .min(1, "User ID is required")
        .openapi({ description: "任务所属用户 ID" }),
    status: z
        .enum(Object.values(TodoStatus) as [string, ...string[]])
        .optional()
        .openapi({
            description: "任务状态",
            example: TodoStatus.PENDING,
        }),
    priority: z
        .enum(Object.values(TodoPriority) as [string, ...string[]])
        .optional()
        .openapi({
            description: "优先级",
            example: TodoPriority.MEDIUM,
        }),
    imageUrl: z
        .string()
        .url(TODO_VALIDATION_MESSAGES.INVALID_IMAGE_URL)
        .optional()
        .or(z.literal(""))
        .openapi({
            description: "关联图片地址，可选",
            example: "https://cdn.example.com/todo.png",
        }),
    imageAlt: z
        .string()
        .optional()
        .or(z.literal(""))
        .openapi({ description: "图片替代文本" }),
    completed: z
        .boolean()
        .optional()
        .openapi({ description: "是否已完成", example: false }),
    dueDate: z
        .string()
        .optional()
        .or(z.literal(""))
        .openapi({ description: "截止日期 (ISO 字符串)" }),
}).openapi("InsertTodoInput", {
    description: "Server Action 创建 Todo 时的表单数据结构。",
});

export const createTodoClientSchema = insertTodoSchema
    .omit({ userId: true })
    .openapi("CreateTodoClientInput", {
        description: "Server Action 创建 Todo 时客户端提交的表单数据，不包含用户 ID。",
    });

export const selectTodoSchema = createSelectSchema(todos);

export const updateTodoSchema = insertTodoSchema.partial().omit({
    id: true,
    userId: true,
    createdAt: true,
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
