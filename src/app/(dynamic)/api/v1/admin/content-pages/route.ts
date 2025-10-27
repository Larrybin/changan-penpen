import { NextResponse } from "next/server";
import {
    type ContentPageInput,
    createContentPage,
    listContentPages,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute(async () => {
    const pages = await listContentPages();
    return NextResponse.json({ data: pages, total: pages.length });
});

export const POST = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as ContentPageInput;
    const created = await createContentPage(body, user.email ?? "admin");
    return NextResponse.json({ data: created });
});
