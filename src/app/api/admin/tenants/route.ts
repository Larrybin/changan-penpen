import { NextResponse } from "next/server";
import { listTenants } from "@/modules/admin/services/tenant.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("perPage") ?? "20");
    const search = url.searchParams.get("search") ?? undefined;

    const data = await listTenants({
        page,
        perPage,
        search: search || undefined,
    });
    return NextResponse.json(data);
}
