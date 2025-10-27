import { NextResponse } from "next/server";
import {
    type CreateReportInput,
    createReport,
    listReports,
} from "@/modules/admin/services/report.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin-shared/utils/pagination";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);

    const data = await listReports({ page, perPage });
    return NextResponse.json(data);
});

export const POST = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as CreateReportInput;
    const created = await createReport(body, user.email ?? "admin");
    return NextResponse.json({ data: created });
});
