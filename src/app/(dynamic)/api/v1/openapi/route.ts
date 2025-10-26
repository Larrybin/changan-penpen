import { NextResponse } from "next/server";

import { getOpenApiDocument } from "@/lib/openapi/document";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const guard = await requireAdminRequest(request);
    if (guard.response) {
        return guard.response;
    }

    const document = getOpenApiDocument();
    return NextResponse.json(document);
}
