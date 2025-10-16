import { NextResponse } from "next/server";
import { withApiCache } from "@/lib/cache";
import { listUsage } from "@/modules/admin/services/usage-overview.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import { parsePaginationParams } from "@/modules/admin/utils/pagination";

export async function GET(request: Request) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const feature = url.searchParams.get("feature") ?? undefined;

    const cacheKey = [
        "admin-usage",
        `tenant:${tenantId ?? "all"}`,
        `feature:${feature ?? "all"}`,
        `page:${page}`,
        `perPage:${perPage}`,
    ].join("|");

    const { value, hit } = await withApiCache(
        {
            key: cacheKey,
            ttlSeconds: 120,
        },
        () =>
            listUsage({
                page,
                perPage,
                tenantId: tenantId || undefined,
                feature: feature || undefined,
            }),
    );

    const response = NextResponse.json(value);
    response.headers.set("X-Cache", hit ? "HIT" : "MISS");
    response.headers.set(
        "Cache-Control",
        "private, max-age=0, must-revalidate",
    );
    return response;
}
