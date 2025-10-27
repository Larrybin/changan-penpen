import { NextResponse } from "next/server";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";
import {
    createTodoForTenant,
    listTodosForAdmin,
    type TodoCreateInput,
} from "@/modules/todos/services/todo.service";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const { data, total } = await listTodosForAdmin({
        page,
        perPage,
        tenantId: tenantId || undefined,
    });

    return NextResponse.json({ data, total });
});

export const POST = withAdminRoute(async ({ request }) => {
    try {
        const payload = (await request.json()) as Partial<TodoCreateInput> & {
            userId?: string;
        };
        const tenantId =
            typeof payload?.userId === "string" &&
            payload.userId.trim().length > 0
                ? payload.userId.trim()
                : null;

        if (!tenantId) {
            return NextResponse.json(
                { message: "userId is required" },
                { status: 400 },
            );
        }

        const { userId: _omit, ...todoInput } = payload;
        const todo = await createTodoForTenant(
            tenantId,
            todoInput as TodoCreateInput,
        );

        return NextResponse.json({ data: todo }, { status: 201 });
    } catch (error) {
        console.error("[api/admin/todos] create error", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to create todo",
            },
            { status: 400 },
        );
    }
});
