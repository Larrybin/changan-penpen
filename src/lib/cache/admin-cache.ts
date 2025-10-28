/**
 * Admin Dashboard Cache Service
 * 基于Upstash Redis的智能分层缓存系统
 * 针对管理员仪表盘优化性能
 */

import { config } from "@/config";
import { getRedisClient } from "@/lib/cache";

import {
    deleteFromMultiLevelCache,
    getMultiLevelCache,
    invalidateMultiLevelCacheStrategy,
} from "@/lib/cache/multi-level-cache";
import { getPlatformContext } from "@/lib/platform/context";

interface CacheEnv extends Record<string, unknown> {
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
}

// 缓存层级配置
export const CACHE_LEVELS = {
    // L1缓存：静态数据（目录概况、站点设置）
    STATIC: { ttl: 300, prefix: "admin:static" }, // 5分钟
    // L2缓存：用户会话级数据（基本统计、历史数据）
    USER: { ttl: 60, prefix: "admin:user" }, // 1分钟
    // L3缓存：实时数据（最新订单、积分变动）
    REALTIME: { ttl: 10, prefix: "admin:realtime" }, // 10秒
} as const;

type CacheKeyParams = Record<string, unknown> | undefined;

// 缓存键生成策略
export const AdminCacheKeyBuilder = {
    staticKey(resource: string): string {
        return `${CACHE_LEVELS.STATIC.prefix}:${resource}`;
    },
    userKey(
        resource: string,
        userId?: string,
        params?: CacheKeyParams,
    ): string {
        const userIdHash = userId || "anonymous";
        const paramString = params ? `:${JSON.stringify(params)}` : "";
        return `${CACHE_LEVELS.USER.prefix}:${resource}:${userIdHash}${paramString}`;
    },
    realtimeKey(resource: string, params?: CacheKeyParams): string {
        const paramString = params ? `:${JSON.stringify(params)}` : "";
        return `${CACHE_LEVELS.REALTIME.prefix}:${resource}${paramString}`;
    },
    // 为仪表盘生成聚合缓存键
    dashboardMetrics(tenantId?: string, from?: string): string {
        const params = { tenantId, from };
        return AdminCacheKeyBuilder.userKey(
            "dashboard:metrics",
            "global",
            params,
        );
    },
    catalogSummary(): string {
        return AdminCacheKeyBuilder.staticKey("catalog:summary");
    },
    latestOrders(tenantId?: string): string {
        return AdminCacheKeyBuilder.realtimeKey("orders:latest", { tenantId });
    },
    recentCredits(tenantId?: string): string {
        return AdminCacheKeyBuilder.realtimeKey("credits:recent", { tenantId });
    },
    // 性能数据缓存键
    performanceMetrics(timeframe: string, tenantId?: string): string {
        const params = { timeframe, tenantId };
        return AdminCacheKeyBuilder.userKey(
            "performance:metrics",
            "global",
            params,
        );
    },
    webVitalsData(timeframe: string, tenantId?: string): string {
        const params = { timeframe, tenantId };
        return AdminCacheKeyBuilder.userKey("webvitals:data", "global", params);
    },
    seoScanData(tenantId?: string): string {
        const params = { tenantId };
        return AdminCacheKeyBuilder.userKey("seo:scan", "global", params);
    },
    systemHealthData(): string {
        return AdminCacheKeyBuilder.realtimeKey("system:health");
    },
} as const;

// 智能缓存管理器
export class AdminCacheManager {
    private env: CacheEnv | undefined;
    private waitUntil?: (promise: Promise<unknown>) => void;

    constructor(env?: CacheEnv) {
        this.env = env;
    }

    private async resolveExecutionOverrides(): Promise<{
        env?: Record<string, unknown>;
        waitUntil?: (promise: Promise<unknown>) => void;
    }> {
        if (!this.env || !this.waitUntil) {
            const context = await getPlatformContext({ async: true });
            if (context.env) {
                this.env = context.env as CacheEnv;
            }
            if (context.waitUntil) {
                this.waitUntil = context.waitUntil;
            }
        }
        return {
            env: this.env,
            waitUntil: this.waitUntil,
        };
    }

    private resolveStrategyName(
        key: string,
        explicit?: string,
    ): string | undefined {
        if (explicit) {
            return explicit;
        }
        if (key.startsWith("admin:tenants")) {
            return "admin.tenants";
        }
        if (key.startsWith("admin:users")) {
            return "admin.users";
        }
        return undefined;
    }

    async get<T>(
        key: string,
        options?: { strategy?: string },
    ): Promise<T | null> {
        const execution = await this.resolveExecutionOverrides();
        const strategy = this.resolveStrategyName(key, options?.strategy);
        const cache = await getMultiLevelCache();
        const { value } = await cache.getValue(key, {
            strategy,
            execution,
        });
        if (value === null) {
            return null;
        }
        try {
            return JSON.parse(value) as T;
        } catch (error) {
            console.warn("[AdminCache] Failed to parse cached value", {
                key,
                error,
            });
            return null;
        }
    }

    async set<T>(
        key: string,
        value: T,
        ttlSeconds?: number,
        options?: { strategy?: string },
    ): Promise<void> {
        const serialized = (() => {
            try {
                return JSON.stringify(value);
            } catch (error) {
                console.warn("[AdminCache] Failed to serialize value", {
                    key,
                    error,
                });
                return null;
            }
        })();
        if (serialized === null) {
            return;
        }
        const execution = await this.resolveExecutionOverrides();
        const strategy = this.resolveStrategyName(key, options?.strategy);
        const cache = await getMultiLevelCache();
        await cache.setValue(key, serialized, {
            strategy,
            ttlSeconds,
            execution,
        });
    }

    async mget<T>(
        keys: string[],
        options?: { strategy?: string },
    ): Promise<(T | null)[]> {
        if (keys.length === 0) {
            return [];
        }
        const results = await Promise.all(
            keys.map((key) => this.get<T>(key, options)),
        );
        return results;
    }

    async mset<T>(
        entries: Array<{
            key: string;
            value: T;
            ttl?: number;
            strategy?: string;
        }>,
    ): Promise<void> {
        if (entries.length === 0) {
            return;
        }
        await Promise.all(
            entries.map((entry) =>
                this.set(entry.key, entry.value, entry.ttl, {
                    strategy: entry.strategy,
                }),
            ),
        );
    }

    async del(key: string, options?: { strategy?: string }): Promise<void> {
        const execution = await this.resolveExecutionOverrides();
        const strategy = this.resolveStrategyName(key, options?.strategy);
        await deleteFromMultiLevelCache(key, {
            strategy,
            execution,
        });
    }

    async invalidatePattern(pattern: string): Promise<void> {
        const execution = await this.resolveExecutionOverrides();
        const redis = getRedisClient(execution.env);
        if (!redis) {
            return;
        }

        try {
            let cursor = "0";
            const deletions: Promise<unknown>[] = [];
            do {
                const [nextCursor, keys] = await redis.scan(cursor, {
                    match: pattern,
                    count: 100,
                });
                if (Array.isArray(keys)) {
                    for (const key of keys) {
                        if (typeof key === "string" && key) {
                            deletions.push(redis.del(key));
                        }
                    }
                }
                cursor = nextCursor;
            } while (cursor !== "0");

            if (deletions.length > 0) {
                await Promise.allSettled(deletions);
                console.info(
                    `[AdminCache] Invalidated ${deletions.length} keys matching pattern: ${pattern}`,
                );
            }
        } catch (error) {
            console.warn("[AdminCache] Pattern invalidation failed", {
                pattern,
                error,
            });
        }
    }

    async increment(key: string, amount: number = 1): Promise<number> {
        const execution = await this.resolveExecutionOverrides();
        const redis = getRedisClient(execution.env);
        if (!redis) {
            return 0;
        }
        try {
            return await redis.incrby(key, amount);
        } catch (error) {
            console.warn("[AdminCache] Increment failed", { key, error });
            return 0;
        }
    }

    async getStats(): Promise<{
        hits: number;
        misses: number;
        hitRate: number;
    }> {
        const hitsKey = "admin:cache:stats:hits";
        const missesKey = "admin:cache:stats:misses";

        const [hits, misses] = await Promise.all([
            this.increment(hitsKey, 0),
            this.increment(missesKey, 0),
        ]);

        const total = hits + misses;
        const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;

        return { hits, misses, hitRate };
    }
}

// 全局缓存管理器实例
let globalCacheManager: AdminCacheManager | null = null;

export function getAdminCacheManager(env?: CacheEnv): AdminCacheManager {
    if (!globalCacheManager) {
        globalCacheManager = new AdminCacheManager(env);
    }
    return globalCacheManager;
}

// 便捷的缓存装饰器函数
export async function withAdminCache<T>(
    level: keyof typeof CACHE_LEVELS,
    keyBuilder: () => string,
    compute: () => Promise<T>,
    options?: {
        tenantId?: string;
        userId?: string;
        customTtl?: number;
        strategy?: string;
    },
): Promise<{ value: T; hit: boolean }> {
    const manager = getAdminCacheManager();
    const cacheConfig = CACHE_LEVELS[level];
    const key = keyBuilder();
    const ttl = options?.customTtl ?? cacheConfig.ttl;

    try {
        const cached = await manager.get<T>(key, {
            strategy: options?.strategy,
        });
        if (cached !== null) {
            await manager.increment("admin:cache:stats:hits");
            return { value: cached, hit: true };
        }

        const value = await compute();
        await manager.set(key, value, ttl, { strategy: options?.strategy });
        await manager.increment("admin:cache:stats:misses");
        return { value, hit: false };
    } catch (error) {
        console.error("[AdminCache] Cache operation failed", { key, error });
        const value = await compute();
        return { value, hit: false };
    }
}

// 智能缓存失效函数
function resolveStrategy(resource: string) {
    const [namespace, ...segments] = resource.split(":");
    const lookup: Record<string, string> = {
        tenants: "admin.tenants",
        users: "admin.users",
    };
    return {
        name: lookup[namespace],
        segments,
    };
}

async function invalidateStrategyKeys(
    manager: AdminCacheManager,
    strategyName: string,
    segments: string[],
) {
    const segmentKey = segments.join(":");
    const predicate =
        segmentKey && segmentKey !== "*"
            ? (key: string) => key.startsWith(segmentKey)
            : undefined;
    await invalidateMultiLevelCacheStrategy(strategyName, { predicate });
    const strategyConfig = config.cache.strategies?.[strategyName];
    if (!strategyConfig?.keyPrefix) {
        return;
    }
    const pattern =
        segmentKey && segmentKey !== "*"
            ? `${strategyConfig.keyPrefix}:${segmentKey}*`
            : `${strategyConfig.keyPrefix}:*`;
    await manager.invalidatePattern(pattern);
}

async function invalidateByLevel(
    manager: AdminCacheManager,
    resource: string,
    level: keyof typeof CACHE_LEVELS,
    tenantId?: string,
) {
    switch (level) {
        case "STATIC":
            await manager.invalidatePattern(
                `${CACHE_LEVELS.STATIC.prefix}:${resource}:*`,
            );
            break;
        case "USER": {
            const suffix = tenantId ? `:${tenantId}*` : "*";
            await manager.invalidatePattern(
                `${CACHE_LEVELS.USER.prefix}:${resource}:*${suffix}`,
            );
            break;
        }
        case "REALTIME":
            await manager.invalidatePattern(
                `${CACHE_LEVELS.REALTIME.prefix}:${resource}:*`,
            );
            break;
    }
}

export async function invalidateAdminCache(
    resource: string,
    options?: {
        tenantId?: string;
        userId?: string;
        level?: keyof typeof CACHE_LEVELS;
    },
): Promise<void> {
    const manager = getAdminCacheManager();
    const { name: strategyName, segments } = resolveStrategy(resource);
    if (strategyName) {
        await invalidateStrategyKeys(manager, strategyName, segments);
    }

    const level = options?.level ?? "USER";
    await invalidateByLevel(manager, resource, level, options?.tenantId);
}
