import { NextResponse } from "next/server";
import { listCreditsHistory } from "@/modules/admin/services/billing.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("perPage") ?? "20");
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const data = await listCreditsHistory({
        page,
        perPage,
        tenantId: tenantId || undefined,
    });
    return NextResponse.json(data);
}
