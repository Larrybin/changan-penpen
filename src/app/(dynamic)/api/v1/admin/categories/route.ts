import { NextResponse } from "next/server";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { listCategoriesForAdmin } from "@/modules/todos/services/category.service";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const data = await listCategoriesForAdmin({
        tenantId: tenantId || undefined,
    });

    return NextResponse.json({ data, total: data.length });
});
