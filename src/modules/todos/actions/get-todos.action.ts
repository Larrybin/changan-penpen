"use server";

import { requireAuth } from "@/modules/auth/utils/auth-utils";
import type { TodoWithCategory } from "@/modules/todos/services/todo.service";
import { listTodosForUser } from "@/modules/todos/services/todo.service";

export default async function getAllTodos(): Promise<TodoWithCategory[]> {
    try {
        const user = await requireAuth();
        const { data } = await listTodosForUser(user.id, {
            page: 1,
            perPage: 100,
        });

        return data;
    } catch (error) {
        console.error("Error fetching todos:", error);
        return [];
    }
}
