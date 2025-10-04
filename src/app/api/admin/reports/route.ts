import { NextResponse } from "next/server";
import {
    createReport,
    listReports,
} from "@/modules/admin/services/report.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("perPage") ?? "20");

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

    const body = await request.json();
    const created = await createReport(body, result.user.email ?? "admin");
    return NextResponse.json({ data: created });
}
