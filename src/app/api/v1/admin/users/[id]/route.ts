import { NextResponse } from "next/server";
import { getUserDetail } from "@/modules/admin/services/user.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, context: RouteContext) {
    const guardResult = await requireAdminRequest(request);
    if (guardResult.response) {
        return guardResult.response;
    }

    const { id } = await context.params;

    const userId = id;
    if (!userId) {
        return NextResponse.json(
            { message: "User ID is required" },
            { status: 400 },
        );
    }

    const detail = await getUserDetail(userId);

    if (!detail) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: detail });
}
