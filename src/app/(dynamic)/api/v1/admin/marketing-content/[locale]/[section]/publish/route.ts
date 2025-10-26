import { NextResponse } from "next/server";

import type { MarketingSectionRouteContext } from "@/modules/admin/routes/marketing-content.types";
import { publishMarketingContent } from "@/modules/admin/services/marketing-content.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export const runtime = "nodejs";

export async function POST(
    request: Request,
    context: MarketingSectionRouteContext,
) {
    const params = await context.params;
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const payload = await publishMarketingContent({
            locale: params.locale,
            section: params.section,
            adminEmail: result.user.email ?? "admin",
        });
        return NextResponse.json({ data: payload });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { message: "Failed to publish marketing content" },
            { status: 400 },
        );
    }
}
