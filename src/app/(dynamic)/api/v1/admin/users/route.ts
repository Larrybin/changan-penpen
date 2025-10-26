import { NextResponse } from "next/server";
import { config } from "@/config";
import { listUsers } from "@/modules/admin/services/user.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const guardResult = await requireAdminRequest(request);
    if (guardResult.response) {
        return guardResult.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams, {
        page: 1,
        perPage: config.pagination.defaultPageSize,
    });

    const email = url.searchParams.get("email") ?? undefined;
    const name = url.searchParams.get("name") ?? undefined;

    const result = await listUsers({
        page,
        perPage,
        email,
        name,
    });

    const totalPages =
        result.perPage > 0 ? Math.ceil(result.total / result.perPage) : 0;

    return NextResponse.json({
        data: result.data,
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages,
    });
}
