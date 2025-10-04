import { NextResponse } from "next/server";
import { listAuditLogs } from "@/modules/admin/services/system-audit.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);

    const data = await listAuditLogs({ page, perPage });
    return NextResponse.json(data);
}
