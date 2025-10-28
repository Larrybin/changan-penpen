/**
 * Admin Dashboard Cache Invalidation Service
 * 智能缓存失效策略
 * 在数据变更时自动清理相关缓存
 */

import { getAdminCacheManager, invalidateAdminCache } from "./admin-cache";

type CacheInvalidationStats = {
    totalEvents: number;
    eventsByType: Record<CacheInvalidationEvent, number>;
    topTenants: Array<{ tenantId: string; count: number }>;
};

const isCacheInvalidationStats = (
    value: unknown,
): value is CacheInvalidationStats => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const stats = value as Partial<CacheInvalidationStats>;
    if (typeof stats.totalEvents !== "number") {
        return false;
    }

    if (
        !stats.eventsByType ||
        typeof stats.eventsByType !== "object" ||
        Array.isArray(stats.eventsByType)
    ) {
        return false;
    }

    if (!Array.isArray(stats.topTenants)) {
        return false;
    }

    return stats.topTenants.every(
        (tenant) =>
            Boolean(tenant) &&
            typeof tenant === "object" &&
            typeof (tenant as { tenantId?: unknown }).tenantId === "string" &&
            typeof (tenant as { count?: unknown }).count === "number",
    );
};

// 缓存失效事件类型
export type CacheInvalidationEvent =
    | "order_created"
    | "order_updated"
    | "credit_added"
    | "credit_deducted"
    | "product_created"
    | "product_updated"
    | "product_deleted"
    | "coupon_created"
    | "coupon_updated"
    | "coupon_deleted"
    | "content_created"
    | "content_updated"
    | "content_deleted"
    | "user_registered"
    | "user_updated";

interface CacheInvalidationPayload {
    event: CacheInvalidationEvent;
    resource?: string;
    resourceId?: string | number;
    tenantId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * 缓存失效管理器
 * 根据事件类型智能决定需要失效的缓存
 */
export class CacheInvalidationManager {
    /**
     * 处理缓存失效事件
     */
    async handleInvalidation(payload: CacheInvalidationPayload): Promise<void> {
        const { event, resource, resourceId, tenantId } = payload;

        console.info("[Cache Invalidation] Processing event", {
            event,
            resource,
            resourceId,
            tenantId,
        });

        try {
            switch (event) {
                // 订单相关事件
                case "order_created":
                case "order_updated":
                    await this.invalidateOrderRelatedCache(tenantId);
                    break;

                // 积分相关事件
                case "credit_added":
                case "credit_deducted":
                    await this.invalidateCreditRelatedCache(tenantId);
                    break;

                // 产品相关事件
                case "product_created":
                case "product_updated":
                case "product_deleted":
                    await this.invalidateCatalogCache();
                    break;

                // 优惠券相关事件
                case "coupon_created":
                case "coupon_updated":
                case "coupon_deleted":
                    await this.invalidateCatalogCache();
                    break;

                // 内容页面相关事件
                case "content_created":
                case "content_updated":
                case "content_deleted":
                    await this.invalidateCatalogCache();
                    break;

                // 用户相关事件
                case "user_registered":
                case "user_updated":
                    await this.invalidateUserRelatedCache(tenantId);
                    break;

                default:
                    console.warn("[Cache Invalidation] Unknown event type", {
                        event,
                    });
                    await this.invalidateAllCache(tenantId);
            }

            // 记录失效事件到审计日志
            await this.logInvalidationEvent(payload);
        } catch (error) {
            console.error("[Cache Invalidation] Failed to process event", {
                event,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * 失效订单相关缓存
     */
    private async invalidateOrderRelatedCache(
        tenantId?: string,
    ): Promise<void> {
        await Promise.all([
            // 失效实时订单数据
            invalidateAdminCache("orders:latest", {
                tenantId,
                level: "REALTIME",
            }),

            // 失效基本统计（订单数量、营收）
            invalidateAdminCache("dashboard:totals", {
                tenantId,
                level: "USER",
            }),

            // 失效整体仪表盘缓存
            invalidateAdminCache("dashboard:*", { tenantId, level: "USER" }),
        ]);
    }

    /**
     * 失效积分相关缓存
     */
    private async invalidateCreditRelatedCache(
        tenantId?: string,
    ): Promise<void> {
        await Promise.all([
            // 失效实时积分数据
            invalidateAdminCache("credits:recent", {
                tenantId,
                level: "REALTIME",
            }),

            // 失效基本统计（总积分）
            invalidateAdminCache("dashboard:totals", {
                tenantId,
                level: "USER",
            }),

            // 失效整体仪表盘缓存
            invalidateAdminCache("dashboard:*", { tenantId, level: "USER" }),
        ]);
    }

    /**
     * 失效目录相关缓存
     */
    private async invalidateCatalogCache(): Promise<void> {
        await Promise.all([
            // 失效目录概况（产品数、优惠券数、内容页数）
            invalidateAdminCache("catalog:summary", { level: "STATIC" }),

            // 失效所有用户的基本统计（可能影响统计计算）
            invalidateAdminCache("dashboard:totals", { level: "USER" }),
        ]);
    }

    /**
     * 失效用户相关缓存
     */
    private async invalidateUserRelatedCache(tenantId?: string): Promise<void> {
        await Promise.all([
            // 失效租户统计
            invalidateAdminCache("dashboard:totals", {
                tenantId,
                level: "USER",
            }),

            // 如果是租户变更，需要失效所有缓存
            tenantId
                ? invalidateAdminCache("dashboard:*", {
                      tenantId,
                      level: "USER",
                  })
                : invalidateAdminCache("dashboard:totals", { level: "USER" }),
        ]);
    }

    /**
     * 失效所有缓存（紧急情况）
     */
    private async invalidateAllCache(tenantId?: string): Promise<void> {
        const manager = getAdminCacheManager();

        const patterns = [
            "admin:*", // 所有admin缓存
        ];

        if (tenantId) {
            patterns.push(`admin:user:*:*${tenantId}*`); // 特定租户缓存
        }

        await Promise.all(
            patterns.map((pattern) => manager.invalidatePattern(pattern)),
        );
    }

    /**
     * 记录缓存失效事件
     */
    private async logInvalidationEvent(
        payload: CacheInvalidationPayload,
    ): Promise<void> {
        const manager = getAdminCacheManager();
        const logKey = `admin:cache:invalidation:${Date.now()}`;

        const logEntry = {
            timestamp: new Date().toISOString(),
            ...payload,
        };

        // 记录到缓存，TTL为7天
        await manager.set(logKey, logEntry, 7 * 24 * 60 * 60);
    }

    /**
     * 获取缓存失效统计
     */
    async getInvalidationStats(
        timeRange: "hour" | "day" | "week" = "day",
    ): Promise<CacheInvalidationStats> {
        const manager = getAdminCacheManager();

        // 这里简化实现，实际可以基于时间范围扫描日志
        const statsKey = `admin:cache:invalidation:stats:${timeRange}`;
        const stats = await manager.get(statsKey);

        if (isCacheInvalidationStats(stats)) {
            return stats;
        }

        // 返回默认统计
        return {
            totalEvents: 0,
            eventsByType: {} as Record<CacheInvalidationEvent, number>,
            topTenants: [],
        };
    }
}

// 全局失效管理器实例
let globalInvalidationManager: CacheInvalidationManager | null = null;

export function getCacheInvalidationManager(): CacheInvalidationManager {
    if (!globalInvalidationManager) {
        globalInvalidationManager = new CacheInvalidationManager();
    }
    return globalInvalidationManager;
}
