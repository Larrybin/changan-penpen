/**
 * Performance Cache Utilities
 * 性能缓存工具
 * 提供性能数据缓存相关的公共常量与辅助函数
 */

import {
    AdminCacheKeyBuilder,
    getAdminCacheManager,
    invalidateAdminCache,
} from "@/lib/cache/admin-cache";

export const PERFORMANCE_TIMEFRAMES = ["1h", "24h", "7d", "30d"] as const;
export type PerformanceTimeframe = (typeof PERFORMANCE_TIMEFRAMES)[number];

export function isValidPerformanceTimeframe(
    value: unknown,
): value is PerformanceTimeframe {
    return (
        typeof value === "string" &&
        (PERFORMANCE_TIMEFRAMES as readonly string[]).includes(value)
    );
}

export async function invalidatePerformanceCache(options?: {
    tenantId?: string;
    timeframe?: PerformanceTimeframe;
}): Promise<void> {
    const timeframes: PerformanceTimeframe[] = options?.timeframe
        ? [options.timeframe]
        : [...PERFORMANCE_TIMEFRAMES];

    const manager = getAdminCacheManager();

    await Promise.all(
        timeframes.map((timeframe) =>
            manager.del(
                AdminCacheKeyBuilder.performanceMetrics(
                    timeframe,
                    options?.tenantId,
                ),
            ),
        ),
    );

    await invalidateAdminCache("performance:metrics", {
        tenantId: options?.tenantId,
        level: "USER",
    });

    console.info("[Performance Cache] Cache invalidated", {
        timeframes,
        tenantId: options?.tenantId,
    });
}
