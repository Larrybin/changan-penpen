import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import {
    createTodoForTenant,
    listTodosForAdmin,
} from "@/modules/todos/services/todo.service";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
    const perPage = Number.parseInt(
        url.searchParams.get("perPage") ?? "20",
        10,
    );
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const { data, total } = await listTodosForAdmin({
        page: Number.isNaN(page) ? 1 : Math.max(page, 1),
        perPage: Number.isNaN(perPage) ? 20 : Math.max(perPage, 1),
        tenantId: tenantId || undefined,
    });

    return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    try {
        const body = await request.json();
        const tenantId =
            typeof body?.userId === "string" && body.userId.trim().length > 0
                ? body.userId.trim()
                : null;

        if (!tenantId) {
            return NextResponse.json(
                { message: "userId is required" },
                { status: 400 },
            );
        }

        const todo = await createTodoForTenant(tenantId, body);

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
}
