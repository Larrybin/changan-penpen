import { NextResponse } from "next/server";

import { getMarketingPreviewPayload } from "@/modules/marketing/services/preview.service";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
        return NextResponse.json(
            { message: "Missing preview token" },
            { status: 400 },
        );
    }

    const payload = await getMarketingPreviewPayload(token);
    if (!payload) {
        return NextResponse.json(
            { message: "Preview token invalid or expired" },
            { status: 404 },
        );
    }

    return NextResponse.json({ data: payload });
}
