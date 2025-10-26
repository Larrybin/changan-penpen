import { NextResponse } from "next/server";
import { listTenants } from "@/modules/admin/services/tenant.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const search = url.searchParams.get("search") ?? undefined;

    const data = await listTenants({
        page,
        perPage,
        search: search || undefined,
    });
    return NextResponse.json(data);
}
