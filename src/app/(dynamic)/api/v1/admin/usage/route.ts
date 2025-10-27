import { config } from "@/config";
import { listUsage } from "@/modules/admin/services/usage-overview.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";
import {
    computeWithAdminCache,
    createAdminCachedJsonResponse,
} from "@/modules/admin/utils/cache";
import { parsePaginationParams } from "@/modules/admin-shared/utils/pagination";

export const GET = withAdminRoute(async ({ request }) => {
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url.searchParams);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const feature = url.searchParams.get("feature") ?? undefined;

    const ttlSeconds = Math.max(config.cache.defaultTtlSeconds ?? 0, 120);

    const { value, hit } = await computeWithAdminCache(
        {
            resource: "usage",
            scope: "list",
            params: {
                tenantId: tenantId ?? null,
                feature: feature ?? null,
                page,
                perPage,
            },
        },
        { ttlSeconds },
        () =>
            listUsage({
                page,
                perPage,
                tenantId: tenantId || undefined,
                feature: feature || undefined,
            }),
    );

    return createAdminCachedJsonResponse(value, { hit });
});
