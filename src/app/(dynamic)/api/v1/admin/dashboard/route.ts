import { NextResponse } from "next/server";
import {
    AdminCacheKeyBuilder,
    getAdminCacheManager,
    withAdminCache,
} from "@/lib/cache/admin-cache";
import type { DashboardMetricsResponse } from "@/modules/admin/services/analytics.service";
import { getDashboardMetrics } from "@/modules/admin/services/analytics.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

/**
 * 优化的仪表盘API路由
 * 集成智能分层缓存系统
 *
 * 缓存策略：
 * - 静态数据（目录概况）：5分钟缓存
 * - 用户级数据（基本统计）：1分钟缓存
 * - 实时数据（最新订单/积分）：10秒缓存
 */
export const GET = withAdminRoute(async ({ request }) => {
    const startTime = performance.now();

    // 解析查询参数
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const bypassCache = url.searchParams.get("bypassCache") === "true";

    // 缓存键生成
    const cacheKey = AdminCacheKeyBuilder.dashboardMetrics(tenantId, from);

    try {
        let metrics: DashboardMetricsResponse;
        let cacheHit = false;

        if (bypassCache) {
            // 强制刷新缓存
            metrics = await getDashboardMetricsWithCaching(tenantId, from);

            // 更新缓存
            const manager = getAdminCacheManager();
            await manager.set(cacheKey, metrics, 60); // 1分钟缓存
        } else {
            // 尝试从缓存获取数据
            const cacheResult = await withAdminCache(
                "USER",
                () => cacheKey,
                () => getDashboardMetricsWithCaching(tenantId, from),
                { tenantId },
            );

            metrics = cacheResult.value;
            cacheHit = cacheResult.hit;
        }

        const responseTime = Math.round(performance.now() - startTime);

        // 记录性能指标
        console.info(
            `[Dashboard API] ${cacheHit ? "Cache HIT" : "Cache MISS"} - ${responseTime}ms`,
            {
                tenantId,
                from,
                cacheHit,
                responseTime,
            },
        );

        return NextResponse.json({
            data: metrics,
            meta: {
                cacheHit,
                responseTime,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[Dashboard API] Error fetching metrics", {
            error: error instanceof Error ? error.message : String(error),
            tenantId,
            from,
        });

        return NextResponse.json(
            {
                error: "Failed to fetch dashboard metrics",
                message: "Please try again later",
                timestamp: new Date().toISOString(),
            },
            { status: 500 },
        );
    }
});

/**
 * 带缓存的数据聚合函数
 * 分别处理不同类型的缓存策略
 */
async function getDashboardMetricsWithCaching(
    tenantId?: string,
    from?: string,
): Promise<DashboardMetricsResponse> {
    // 并行获取所有数据类型
    const [
        totalsResult,
        usageTrendResult,
        latestOrdersResult,
        recentCreditsResult,
        catalogSummaryResult,
    ] = await Promise.allSettled([
        // 基本统计 - 用户级缓存
        withAdminCache(
            "USER",
            () =>
                AdminCacheKeyBuilder.userKey("dashboard:totals", "global", {
                    tenantId,
                }),
            () => getDashboardMetrics({ tenantId, from }).then((m) => m.totals),
            { tenantId, customTtl: 60 },
        ),

        // 使用趋势 - 用户级缓存
        withAdminCache(
            "USER",
            () =>
                AdminCacheKeyBuilder.userKey("dashboard:usage", "global", {
                    tenantId,
                    from,
                }),
            () =>
                getDashboardMetrics({ tenantId, from }).then(
                    (m) => m.usageTrend,
                ),
            { tenantId, customTtl: 60 },
        ),

        // 最新订单 - 实时缓存
        withAdminCache(
            "REALTIME",
            () => AdminCacheKeyBuilder.latestOrders(tenantId),
            () =>
                getDashboardMetrics({ tenantId, from }).then(
                    (m) => m.latestOrders,
                ),
            { tenantId },
        ),

        // 最新积分变动 - 实时缓存
        withAdminCache(
            "REALTIME",
            () => AdminCacheKeyBuilder.recentCredits(tenantId),
            () =>
                getDashboardMetrics({ tenantId, from }).then(
                    (m) => m.recentCredits,
                ),
            { tenantId },
        ),

        // 目录概况 - 静态缓存
        withAdminCache(
            "STATIC",
            () => AdminCacheKeyBuilder.catalogSummary(),
            () =>
                getDashboardMetrics({ tenantId, from }).then(
                    (m) => m.catalogSummary,
                ),
        ),
    ]);

    // 组装结果，处理可能的失败
    const baseMetrics = await getDashboardMetrics({ tenantId, from });

    return {
        totals:
            totalsResult.status === "fulfilled"
                ? totalsResult.value.value
                : baseMetrics.totals,
        usageTrend:
            usageTrendResult.status === "fulfilled"
                ? usageTrendResult.value.value
                : baseMetrics.usageTrend,
        latestOrders:
            latestOrdersResult.status === "fulfilled"
                ? latestOrdersResult.value.value
                : baseMetrics.latestOrders,
        recentCredits:
            recentCreditsResult.status === "fulfilled"
                ? recentCreditsResult.value.value
                : baseMetrics.recentCredits,
        catalogSummary:
            catalogSummaryResult.status === "fulfilled"
                ? catalogSummaryResult.value.value
                : baseMetrics.catalogSummary,
    };
}
