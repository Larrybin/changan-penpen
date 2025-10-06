import { NextResponse } from "next/server";
import {
    type CreateReportInput,
    createReport,
    listReports,
} from "@/modules/admin/services/report.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);

    const data = await listReports({ page, perPage });
    return NextResponse.json(data);
}

export async function POST(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = (await request.json()) as CreateReportInput;
    const created = await createReport(body, result.user.email ?? "admin");
    return NextResponse.json({ data: created });
}
