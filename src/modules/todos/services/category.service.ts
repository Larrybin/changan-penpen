import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
    categories,
    insertCategorySchema,
    updateCategorySchema,
} from "@/modules/todos/schemas/category.schema";

const createCategoryForUserSchema = insertCategorySchema.omit({ userId: true });
const updateCategoryForUserSchema = updateCategorySchema;

export type CategoryCreateInput = z.input<typeof createCategoryForUserSchema>;
export type CategoryUpdateInput = z.input<typeof updateCategoryForUserSchema>;

export interface ListCategoriesOptions {
    tenantId?: string;
}

export async function listCategoriesForUser(userId: string) {
    const db = await getDb();

    return db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId))
        .orderBy(categories.createdAt);
}

export async function listCategoriesForAdmin(
    options: ListCategoriesOptions = {},
) {
    const db = await getDb();

    if (!options.tenantId) {
        return [];
    }

    return db
        .select()
        .from(categories)
        .where(eq(categories.userId, options.tenantId))
        .orderBy(categories.createdAt);
}

export async function createCategoryForUser(
    userId: string,
    input: CategoryCreateInput,
) {
    const db = await getDb();
    const parsed = createCategoryForUserSchema.parse({ ...input });
    const now = new Date().toISOString();

    const created = await db
        .insert(categories)
        .values({
            ...parsed,
            userId,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    if (!created[0]) {
        throw new Error("Failed to create category");
    }

    return created[0];
}

export async function updateCategoryForUser(
    userId: string,
    categoryId: number,
    input: CategoryUpdateInput,
) {
    const db = await getDb();
    const parsed = updateCategoryForUserSchema.parse({ ...input });

    const updated = await db
        .update(categories)
        .set({
            ...parsed,
            updatedAt: new Date().toISOString(),
        })
        .where(
            and(eq(categories.id, categoryId), eq(categories.userId, userId)),
        )
        .returning();

    if (!updated[0]) {
        throw new Error("Category not found or unauthorized");
    }

    return updated[0];
}
