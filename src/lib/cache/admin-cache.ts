/**
 * Admin Dashboard Cache Service
 * 基于Upstash Redis的智能分层缓存系统
 * 针对管理员仪表盘优化性能
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Redis } from "@upstash/redis/cloudflare";

interface CacheEnv {
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
        return AdminCacheKeyBuilder.userKey(
            "webvitals:data",
            "global",
            params,
        );
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
    private redis: Redis | null = null;
    private env: CacheEnv | undefined;

    constructor(env?: CacheEnv) {
        this.env = env;
        this.initRedis();
    }

    private async initRedis(): Promise<void> {
        if (this.redis) return;

        const context = this.env
            ? null
            : await getCloudflareContext({ async: true }).catch(() => null);

        const resolvedEnv =
            this.env ?? (context?.env as CacheEnv | undefined) ?? undefined;

        if (
            !resolvedEnv?.UPSTASH_REDIS_REST_URL ||
            !resolvedEnv?.UPSTASH_REDIS_REST_TOKEN
        ) {
            console.warn("[AdminCache] Upstash Redis configuration missing");
            return;
        }

        this.redis = new Redis({
            url: resolvedEnv.UPSTASH_REDIS_REST_URL,
            token: resolvedEnv.UPSTASH_REDIS_REST_TOKEN,
            // 启用自动管道化优化性能
            enableAutoPipelining: true,
            responseEncoding: "base64",
        });
    }

    // 通用缓存获取方法
    async get<T>(key: string): Promise<T | null> {
        if (!this.redis) return null;

        try {
            const cached = await this.redis.get<string>(key);
            if (!cached) return null;

            return JSON.parse(cached) as T;
        } catch (error) {
            console.warn("[AdminCache] Cache get failed", { key, error });
            return null;
        }
    }

    // 通用缓存设置方法
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        if (!this.redis) return;

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.set(key, serialized, { ex: ttlSeconds });
            } else {
                await this.redis.set(key, serialized);
            }
        } catch (error) {
            console.warn("[AdminCache] Cache set failed", { key, error });
        }
    }

    // 批量获取（利用自动管道化）
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        if (!this.redis || keys.length === 0)
            return new Array(keys.length).fill(null);

        try {
            const values = await this.redis.mget<string[]>(...keys);
            return values.map((value) => {
                if (!value) return null;
                try {
                    return JSON.parse(value) as T;
                } catch {
                    return null;
                }
            });
        } catch (error) {
            console.warn("[AdminCache] Batch get failed", { keys, error });
            return new Array(keys.length).fill(null);
        }
    }

    // 批量设置（利用自动管道化）
    async mset<T>(
        entries: Array<{ key: string; value: T; ttl?: number }>,
    ): Promise<void> {
        if (!this.redis || entries.length === 0) return;

        try {
            const pipeline = this.redis.multi();

            entries.forEach(({ key, value, ttl }) => {
                const serialized = JSON.stringify(value);
                if (ttl) {
                    pipeline.set(key, serialized, { ex: ttl });
                } else {
                    pipeline.set(key, serialized);
                }
            });

            await pipeline.exec();
        } catch (error) {
            console.warn("[AdminCache] Batch set failed", { entries, error });
        }
    }

    // 删除缓存
    async del(key: string): Promise<void> {
        if (!this.redis) return;

        try {
            await this.redis.del(key);
        } catch (error) {
            console.warn("[AdminCache] Cache delete failed", { key, error });
        }
    }

    // 模式匹配删除（用于失效策略）
    async invalidatePattern(pattern: string): Promise<void> {
        const redis = this.redis;
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

                if (Array.isArray(keys) && keys.length > 0) {
                    keys.forEach((key) => {
                        if (typeof key === "string" && key) {
                            deletions.push(redis.del(key));
                        }
                    });
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

    // 原子性计数器操作（用于统计缓存命中）
    async increment(key: string, amount: number = 1): Promise<number> {
        if (!this.redis) return 0;

        try {
            return await this.redis.incrby(key, amount);
        } catch (error) {
            console.warn("[AdminCache] Increment failed", { key, error });
            return 0;
        }
    }

    // 获取缓存统计
    async getStats(): Promise<{
        hits: number;
        misses: number;
        hitRate: number;
    }> {
        const hitsKey = "admin:cache:stats:hits";
        const missesKey = "admin:cache:stats:misses";

        const [hits, misses] = await Promise.all([
            this.increment(hitsKey, 0), // 读取当前值
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
    },
): Promise<{ value: T; hit: boolean }> {
    const manager = getAdminCacheManager();
    const cacheConfig = CACHE_LEVELS[level];
    const key = keyBuilder();
    const ttl = options?.customTtl ?? cacheConfig.ttl;

    try {
        const cached = await manager.get<T>(key);
        if (cached !== null) {
            await manager.increment("admin:cache:stats:hits");
            return { value: cached, hit: true };
        }

        const value = await compute();
        await manager.set(key, value, ttl);
        await manager.increment("admin:cache:stats:misses");
        return { value, hit: false };
    } catch (error) {
        console.error("[AdminCache] Cache operation failed", { key, error });
        const value = await compute();
        return { value, hit: false };
    }
}

// 智能缓存失效函数
export async function invalidateAdminCache(
    resource: string,
    options?: {
        tenantId?: string;
        userId?: string;
        level?: keyof typeof CACHE_LEVELS;
    },
): Promise<void> {
    const manager = getAdminCacheManager();
    const level = options?.level ?? "USER";

    if (level === "STATIC") {
        // 失效静态缓存
        await manager.invalidatePattern(
            `${CACHE_LEVELS.STATIC.prefix}:${resource}:*`,
        );
    } else if (level === "USER") {
        // 失效用户缓存
        if (options?.tenantId) {
            await manager.invalidatePattern(
                `${CACHE_LEVELS.USER.prefix}:${resource}:*:${options.tenantId}*`,
            );
        } else {
            await manager.invalidatePattern(
                `${CACHE_LEVELS.USER.prefix}:${resource}:*`,
            );
        }
    } else if (level === "REALTIME") {
        // 失效实时缓存
        await manager.invalidatePattern(
            `${CACHE_LEVELS.REALTIME.prefix}:${resource}:*`,
        );
    }
}
