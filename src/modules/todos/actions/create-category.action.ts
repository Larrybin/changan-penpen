"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import type { Category } from "@/modules/todos/schemas/category.schema";
import { createCategoryForUser } from "@/modules/todos/services/category.service";
import todosRoutes from "../todos.route";

export async function createCategory(data: unknown): Promise<Category> {
    try {
        const user = await requireAuth();
        const category = await createCategoryForUser(user.id, data as object);

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
