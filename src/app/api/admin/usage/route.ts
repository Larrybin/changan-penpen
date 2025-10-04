import { NextResponse } from "next/server";
import { listUsage } from "@/modules/admin/services/usage-overview.service";
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
    const feature = url.searchParams.get("feature") ?? undefined;

    const data = await listUsage({
        page,
        perPage,
        tenantId: tenantId || undefined,
        feature: feature || undefined,
    });
    return NextResponse.json(data);
}
