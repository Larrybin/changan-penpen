"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { deleteTodoForUser } from "@/modules/todos/services/todo.service";
import todosRoutes from "../todos.route";

export async function deleteTodoAction(todoId: number) {
    try {
        const user = await requireAuth();
        await deleteTodoForUser(user.id, todoId);

        revalidatePath(todosRoutes.list);

        return {
            success: true,
            message: "Todo deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting todo:", error);

        if (
            error instanceof Error &&
            error.message === "Authentication required"
        ) {
            return {
                success: false,
                error: "Authentication required",
            };
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete todo",
        };
    }
}
