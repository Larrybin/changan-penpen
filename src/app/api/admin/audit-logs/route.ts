import { NextResponse } from "next/server";
import { listAuditLogs } from "@/modules/admin/services/system-audit.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("perPage") ?? "20");

    const data = await listAuditLogs({ page, perPage });
    return NextResponse.json(data);
}
