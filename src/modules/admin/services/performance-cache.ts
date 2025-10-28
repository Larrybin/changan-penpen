/**
 * Performance Cache Utilities
 * 性能缓存工具
 * 提供性能数据缓存相关的公共常量与辅助函数
 */

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
