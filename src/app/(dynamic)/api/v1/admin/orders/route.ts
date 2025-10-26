import { NextResponse } from "next/server";
import { listOrders } from "@/modules/admin/services/billing.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const data = await listOrders({
        page,
        perPage,
        tenantId: tenantId || undefined,
    });
    return NextResponse.json(data);
}
