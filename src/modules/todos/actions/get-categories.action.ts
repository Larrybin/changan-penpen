"use server";

import type { Category } from "@/modules/todos/schemas/category.schema";
import { listCategoriesForUser } from "@/modules/todos/services/category.service";

export async function getAllCategories(userId: string): Promise<Category[]> {
    try {
        return await listCategoriesForUser(userId);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}
