import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import {
    deleteTodoForAdmin,
    getTodoByIdForAdmin,
    updateTodoForAdmin,
    type TodoUpdateInput,
} from "@/modules/todos/services/todo.service";

function parseId(param: string | string[] | undefined) {
    if (!param) return null;
    const value = Array.isArray(param) ? param[0] : param;
    const id = Number.parseInt(value, 10);
    return Number.isNaN(id) ? null : id;
}

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const todoId = parseId(id);

    if (todoId === null) {
        return NextResponse.json(
            { message: "Invalid todo id" },
            { status: 400 },
        );
    }

    const todo = await getTodoByIdForAdmin(todoId);

    if (!todo) {
        return NextResponse.json(
            { message: "Todo not found" },
            { status: 404 },
        );
    }

    return NextResponse.json({ data: todo });
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const todoId = parseId(id);

    if (todoId === null) {
        return NextResponse.json(
            { message: "Invalid todo id" },
            { status: 400 },
        );
    }

    try {
        const body = (await request.json()) as TodoUpdateInput;
        const todo = await updateTodoForAdmin(todoId, body);

        return NextResponse.json({ data: todo });
    } catch (error) {
        console.error("[api/admin/todos/:id] update error", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update todo",
            },
            { status: 400 },
        );
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const todoId = parseId(id);

    if (todoId === null) {
        return NextResponse.json(
            { message: "Invalid todo id" },
            { status: 400 },
        );
    }

    try {
        await deleteTodoForAdmin(todoId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/admin/todos/:id] delete error", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete todo",
            },
            { status: 400 },
        );
    }
}
