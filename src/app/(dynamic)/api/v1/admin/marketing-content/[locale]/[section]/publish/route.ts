import { NextResponse } from "next/server";

import { publishMarketingContent } from "@/modules/admin/services/marketing-content.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface RouteContext {
    params: {
        locale: string;
        section: string;
    };
}

export async function POST(request: Request, context: RouteContext) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const payload = await publishMarketingContent({
            locale: context.params.locale,
            section: context.params.section,
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
