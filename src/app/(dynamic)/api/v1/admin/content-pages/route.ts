import { NextResponse } from "next/server";
import {
    type ContentPageInput,
    createContentPage,
    listContentPages,
} from "@/modules/admin/services/catalog.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const pages = await listContentPages();
    return NextResponse.json({ data: pages, total: pages.length });
}

export async function POST(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = (await request.json()) as ContentPageInput;
    const created = await createContentPage(body, result.user.email ?? "admin");
    return NextResponse.json({ data: created });
}
