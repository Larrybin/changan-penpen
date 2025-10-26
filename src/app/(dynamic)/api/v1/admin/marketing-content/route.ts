import { NextResponse } from "next/server";

import { getMarketingContentMetadata } from "@/modules/admin/services/marketing-content.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const metadata = await getMarketingContentMetadata();
    return NextResponse.json({ data: metadata });
}
