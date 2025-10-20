"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type UploadResult, uploadToR2 } from "@/lib/r2";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { TodoStatus } from "@/modules/todos/models/todo.enum";
import { updateTodoSchema } from "@/modules/todos/schemas/todo.schema";
import { updateTodoForUser } from "@/modules/todos/services/todo.service";
import todosRoutes from "../todos.route";

function parseTodoFormData(
    formData: FormData,
): Record<string, string | number | boolean> {
    const todoData: Record<string, string | number | boolean> = {};
    for (const [key, value] of formData.entries()) {
        if (key === "image") continue;
        if (key === "completed") {
            todoData[key] = value === "true";
        } else if (key === "categoryId") {
            const numValue = parseInt(value as string, 10);
            if (!Number.isNaN(numValue)) todoData[key] = numValue;
        } else if (value && value !== "" && typeof value === "string") {
            todoData[key] = value;
        }
    }
    return todoData;
}

async function maybeUploadImage(
    file: File | undefined,
): Promise<{ imageUrl?: string; imageAlt?: string }> {
    if (!file) return {};
    const uploadResult: UploadResult = await uploadToR2(file, "todo-images");
    if (!uploadResult.success) {
        console.error("Image upload failed:", uploadResult.error);
        return {};
    }
    const object = uploadResult.object;
    if (!object.url) return {};
    return { imageUrl: object.url, imageAlt: file.name };
}

export async function updateTodoAction(todoId: number, formData: FormData) {
    try {
        const user = await requireAuth();

        const imageFile = formData.get("image") as File | null;
        const file = imageFile && imageFile.size > 0 ? imageFile : undefined;

        const todoData = parseTodoFormData(formData);

        const validatedData = updateTodoSchema.parse(todoData);

        let { imageUrl, imageAlt } = await maybeUploadImage(file);
        if (imageUrl) imageAlt = validatedData.imageAlt || imageAlt;

        const { status, priority, ...restValidatedData } = validatedData;

        await updateTodoForUser(user.id, todoId, {
            ...restValidatedData,
            ...(status && {
                status: status as (typeof TodoStatus)[keyof typeof TodoStatus],
            }),
            ...(priority && { priority }),
            ...(imageUrl && { imageUrl }),
            ...(imageAlt && { imageAlt }),
        });

        revalidatePath(todosRoutes.list);
        redirect(todosRoutes.list);
    } catch (error) {
        console.error("Error updating todo:", error);

        if (
            error instanceof Error &&
            error.message === "Authentication required"
        ) {
            throw new Error("Authentication required");
        }

        throw new Error("Unable to update todo at this time.");
    }
}

export async function updateTodoFieldAction(
    todoId: number,
    data: { completed?: boolean },
) {
    try {
        const user = await requireAuth();
        const updated = await updateTodoForUser(user.id, todoId, {
            ...data,
            ...(data.completed !== undefined && {
                status: data.completed
                    ? TodoStatus.COMPLETED
                    : TodoStatus.PENDING,
            }),
        });

        if (!updated) {
            return {
                success: false,
                error: "Todo not found or unauthorized",
            };
        }

        revalidatePath(todosRoutes.list);

        return {
            success: true,
            data: updated,
        };
    } catch (error) {
        console.error("Error updating todo field:", error);

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
            error: "Unable to update todo at this time.",
        };
    }
}
