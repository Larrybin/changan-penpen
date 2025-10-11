"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type UploadResult, uploadToR2 } from "@/lib/r2";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";
import { insertTodoSchema } from "@/modules/todos/schemas/todo.schema";
import { createTodoForUser } from "@/modules/todos/services/todo.service";
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

export async function createTodoAction(formData: FormData) {
    try {
        const user = await requireAuth();

        const imageFile = formData.get("image") as File | null;
        const file = imageFile && imageFile.size > 0 ? imageFile : undefined;

        const todoData = parseTodoFormData(formData);

        // Validate the data
        const validatedData = insertTodoSchema.parse({
            ...todoData,
            userId: user.id,
        });
        const { userId: _ignoredUserId, ...todoInput } = validatedData;

        // Handle optional image upload
        let { imageUrl, imageAlt } = await maybeUploadImage(file);
        if (imageUrl) imageAlt = validatedData.imageAlt || imageAlt;

        await createTodoForUser(user.id, {
            ...todoInput,
            status:
                (validatedData.status as (typeof TodoStatus)[keyof typeof TodoStatus]) ||
                TodoStatus.PENDING,
            priority:
                (validatedData.priority as (typeof TodoPriority)[keyof typeof TodoPriority]) ||
                TodoPriority.MEDIUM,
            imageUrl: imageUrl || validatedData.imageUrl,
            imageAlt: imageAlt || validatedData.imageAlt,
        });

        revalidatePath(todosRoutes.list);
        redirect(todosRoutes.list);
    } catch (error) {
        console.error("Error creating todo:", error);

        if (
            error instanceof Error &&
            error.message === "Authentication required"
        ) {
            throw new Error("Authentication required");
        }

        throw new Error(
            error instanceof Error ? error.message : "Failed to create todo",
        );
    }
}
