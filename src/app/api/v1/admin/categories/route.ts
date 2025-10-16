import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { listCategoriesForAdmin } from "@/modules/todos/services/category.service";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const data = await listCategoriesForAdmin({
        tenantId: tenantId || undefined,
    });

    return NextResponse.json({ data, total: data.length });
}
