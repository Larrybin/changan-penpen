import { Redis } from "@upstash/redis/cloudflare";

import type { MetricTags } from "@/lib/observability/metrics";
import { recordMetric } from "@/lib/observability/metrics";
import {
    getPlatformContext,
    getPlatformWaitUntil,
} from "@/lib/platform/context";

interface CacheEnv {
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
}

interface WithCacheOptions<Env extends CacheEnv> {
    key: string;
    ttlSeconds: number;
    env?: Env;
    waitUntil?: (promise: Promise<unknown>) => void;
}

const redisClients = new Map<string, { client: Redis; lastUsed: number }>();
const CLIENT_TTL_MS = 15 * 60 * 1000;
const MAX_CLIENTS = 4;

const CACHE_METRIC_BASE: MetricTags = {
    cache_name: "api-response",
    layer: "upstash-redis",
};

type CacheLookupResult = "hit" | "miss" | "error" | "bypass";

function recordCacheLookup(result: CacheLookupResult, extra?: MetricTags) {
    recordMetric("cache.lookup", 1, {
        ...CACHE_METRIC_BASE,
        operation: "get",
        result,
        ...extra,
    });
}

function recordCacheWrite(
    result: "success" | "error",
    extra?: MetricTags,
): void {
    recordMetric("cache.write", 1, {
        ...CACHE_METRIC_BASE,
        operation: "set",
        result,
        ...extra,
    });
}

function cleanupRedisClients(now: number) {
    for (const [key, record] of redisClients) {
        if (now - record.lastUsed > CLIENT_TTL_MS) {
            redisClients.delete(key);
        }
    }

    if (redisClients.size <= MAX_CLIENTS) {
        return;
    }

    const entries = Array.from(redisClients.entries()).sort(
        (a, b) => a[1].lastUsed - b[1].lastUsed,
    );
    while (entries.length > MAX_CLIENTS) {
        const [key] = entries.shift() ?? [];
        if (key) {
            redisClients.delete(key);
        }
    }
}

export function getRedisClient(env: CacheEnv | undefined): Redis | null {
    const url = env?.UPSTASH_REDIS_REST_URL;
    const token = env?.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        return null;
    }
    const cacheKey = `${url}::${token}`;
    const now = Date.now();
    cleanupRedisClients(now);
    const existing = redisClients.get(cacheKey);
    if (existing) {
        existing.lastUsed = now;
        return existing.client;
    }
    const client = new Redis({ url, token });
    redisClients.set(cacheKey, { client, lastUsed: now });
    cleanupRedisClients(now);
    return client;
}

function safeStringify(value: unknown): string | null {
    try {
        return JSON.stringify(value);
    } catch (error) {
        console.warn("[cache] failed to stringify value", { error });
        recordCacheWrite("error", {
            error_type: "serialize",
            error_name: error instanceof Error ? error.name : "unknown",
        });
        return null;
    }
}

function safeParse<T>(value: string | null): { result: T | null; error?: unknown } {
    if (value === null) {
        return { result: null };
    }
    try {
        return { result: JSON.parse(value) as T };
    } catch (error) {
        console.warn("[cache] failed to parse value", { error });
        return { result: null, error };
    }
}

export async function withApiCache<T, Env extends CacheEnv = CacheEnv>(
    options: WithCacheOptions<Env>,
    compute: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
    const { key, ttlSeconds, waitUntil } = options;
    if (!key) {
        recordCacheLookup("bypass", { reason: "empty-key" });
        const value = await compute();
        return { value, hit: false };
    }

    const providedEnv = options.env;
    const context = providedEnv
        ? undefined
        : await getPlatformContext({ async: true });
    const env =
        providedEnv ?? (context?.env as CacheEnv | undefined) ?? undefined;
    const redis = getRedisClient(env);
    if (!redis) {
        recordCacheLookup("bypass", { reason: "missing-binding" });
        const value = await compute();
        return { value, hit: false };
    }

    try {
        const cached = await redis.get<string>(key);
        const { result: parsed, error: parseError } = safeParse<T>(cached ?? null);
        if (parsed !== null) {
            recordCacheLookup("hit");
            return { value: parsed, hit: true };
        }

        if (cached === null) {
            recordCacheLookup("miss");
        } else if (parseError) {
            recordCacheLookup("error", {
                error_type: "parse",
                error_name:
                    parseError instanceof Error ? parseError.name : "unknown",
            });
        } else {
            recordCacheLookup("miss");
        }
    } catch (error) {
        console.warn("[cache] failed to read", { key, error });
        recordCacheLookup("error", {
            error_type: "read",
            error_name: error instanceof Error ? error.name : "unknown",
        });
    }

    const value = await compute();
    const serialized = safeStringify(value);
    if (serialized !== null) {
        const persist = redis
            .set(key, serialized, { ex: ttlSeconds })
            .then(() => {
                recordCacheWrite("success", { ttl_seconds: ttlSeconds });
            })
            .catch((error) => {
                recordCacheWrite("error", {
                    error_type: "write",
                    error_name: error instanceof Error ? error.name : "unknown",
                });
                throw error;
            });
        const asyncWaiter =
            waitUntil ??
            (context?.ctx
                ? context.ctx.waitUntil.bind(context.ctx)
                : await getPlatformWaitUntil({ async: true }));
        if (asyncWaiter) {
            asyncWaiter(
                persist.catch((error) => {
                    console.warn("[cache] failed to persist", { key, error });
                    throw error;
                }),
            );
        } else {
            persist.catch((error) =>
                console.warn("[cache] failed to persist", { key, error }),
            );
        }
    }

    return { value, hit: false };
}
