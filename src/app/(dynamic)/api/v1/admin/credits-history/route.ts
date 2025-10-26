import { NextResponse } from "next/server";
import { listCreditsHistory } from "@/modules/admin/services/billing.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const data = await listCreditsHistory({
        page,
        perPage,
        tenantId: tenantId || undefined,
    });
    return NextResponse.json(data);
});
