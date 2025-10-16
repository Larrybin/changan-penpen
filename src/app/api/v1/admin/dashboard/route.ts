import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/modules/admin/services/analytics.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;

    const metrics = await getDashboardMetrics({
        tenantId: tenantId || undefined,
        from: from || undefined,
    });
    return NextResponse.json({ data: metrics });
}
