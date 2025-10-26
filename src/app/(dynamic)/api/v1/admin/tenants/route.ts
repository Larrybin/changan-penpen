import { NextResponse } from "next/server";
import { listTenants } from "@/modules/admin/services/tenant.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const search = url.searchParams.get("search") ?? undefined;

    const data = await listTenants({
        page,
        perPage,
        search: search || undefined,
    });
    return NextResponse.json(data);
});
