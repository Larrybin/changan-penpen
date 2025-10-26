import { NextResponse } from "next/server";

import type { MarketingSectionParams } from "@/modules/admin/routes/marketing-content.types";
import {
    generatePreviewToken,
    PreviewTokenGenerationError,
} from "@/modules/admin/services/marketing-content.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const POST = withAdminRoute<MarketingSectionParams>(
    async ({ params, user }) => {
        try {
            const payload = await generatePreviewToken({
                locale: params.locale,
                section: params.section,
                adminEmail: user.email ?? "admin",
            });
            return NextResponse.json({ data: payload });
        } catch (error) {
            if (error instanceof PreviewTokenGenerationError) {
                return NextResponse.json(
                    { message: error.message },
                    { status: 503 },
                );
            }

            if (error instanceof Error) {
                return NextResponse.json(
                    { message: error.message },
                    { status: 400 },
                );
            }
            return NextResponse.json(
                { message: "Failed to create preview token" },
                { status: 400 },
            );
        }
    },
);
