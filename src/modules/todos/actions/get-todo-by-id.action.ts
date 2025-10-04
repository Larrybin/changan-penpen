"use server";

import { requireAuth } from "@/modules/auth/utils/auth-utils";
import type { TodoWithCategory } from "@/modules/todos/services/todo.service";
import { getTodoByIdForUser } from "@/modules/todos/services/todo.service";

export async function getTodoById(
    id: number,
): Promise<TodoWithCategory | null> {
    try {
        const user = await requireAuth();
        const todo = await getTodoByIdForUser(user.id, id);

        return todo;
    } catch (error) {
        console.error("Error fetching todo by id:", error);
        return null;
    }
}
