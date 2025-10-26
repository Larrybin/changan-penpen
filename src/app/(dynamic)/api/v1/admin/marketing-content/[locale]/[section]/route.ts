import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
    getMarketingContentDraft,
    upsertMarketingContentDraft,
} from "@/modules/admin/services/marketing-content.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface RouteContext {
    params: {
        locale: string;
        section: string;
    };
}

export async function GET(request: Request, context: RouteContext) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const draft = await getMarketingContentDraft(
        context.params.locale,
        context.params.section,
    );
    return NextResponse.json({ data: draft });
}

export async function PUT(request: Request, context: RouteContext) {
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    try {
        const body = (await request.json()) as {
            payload: unknown;
        };
        const draft = await upsertMarketingContentDraft({
            locale: context.params.locale,
            section: context.params.section,
            payload: body.payload,
            adminEmail: result.user.email ?? "admin",
        });
        return NextResponse.json({ data: draft });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { message: "Invalid marketing payload", errors: error.issues },
                { status: 422 },
            );
        }
        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { message: "Failed to save draft" },
            { status: 400 },
        );
    }
}
