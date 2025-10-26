import { NextResponse } from "next/server";

import { getMarketingContentMetadata } from "@/modules/admin/services/marketing-content.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute(async () => {
    const metadata = await getMarketingContentMetadata();
    return NextResponse.json({ data: metadata });
});
