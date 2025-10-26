import { NextResponse } from "next/server";
import { listAuditLogs } from "@/modules/admin/services/system-audit.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);

    const data = await listAuditLogs({ page, perPage });
    return NextResponse.json(data);
});
