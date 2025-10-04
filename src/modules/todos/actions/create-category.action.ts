"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import type { Category } from "@/modules/todos/schemas/category.schema";
import {
    createCategoryForUser,
    type CategoryCreateInput,
} from "@/modules/todos/services/category.service";
import todosRoutes from "../todos.route";

export async function createCategory(data: unknown): Promise<Category> {
    try {
        const user = await requireAuth();
        const payload = (data ?? {}) as Partial<CategoryCreateInput>;
        const name =
            typeof payload.name === "string" ? payload.name.trim() : "";
        if (!name) {
            throw new Error("Category name is required");
        }
        const category = await createCategoryForUser(user.id, {
            name,
            description:
                typeof payload.description === "string"
                    ? payload.description
                    : undefined,
            color:
                typeof payload.color === "string" ? payload.color : undefined,
        });

        // Revalidate pages that might show categories
        revalidatePath(todosRoutes.list);
        revalidatePath(todosRoutes.new);

        return category;
    } catch (error) {
        console.error("Error creating category:", error);

        throw new Error(
            error instanceof Error
                ? error.message
                : "Failed to create category",
        );
    }
}
