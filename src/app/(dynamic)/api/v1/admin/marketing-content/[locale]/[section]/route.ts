import { NextResponse } from "next/server";
import { ZodError } from "zod";

import type { MarketingSectionParams } from "@/modules/admin/routes/marketing-content.types";
import {
    getMarketingContentDraft,
    upsertMarketingContentDraft,
} from "@/modules/admin/services/marketing-content.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute<MarketingSectionParams>(
    async ({ params }) => {
        const draft = await getMarketingContentDraft(
            params.locale,
            params.section,
        );
        return NextResponse.json({ data: draft });
    },
);

export const PUT = withAdminRoute<MarketingSectionParams>(
    async ({ request, params, user }) => {
        try {
            const body = (await request.json()) as {
                payload: unknown;
            };
            const draft = await upsertMarketingContentDraft({
                locale: params.locale,
                section: params.section,
                payload: body.payload,
                adminEmail: user.email ?? "admin",
            });
            return NextResponse.json({ data: draft });
        } catch (error) {
            if (error instanceof ZodError) {
                return NextResponse.json(
                    {
                        message: "Invalid marketing payload",
                        errors: error.issues,
                    },
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
    },
);
