import { Redis } from "@upstash/redis/cloudflare";

import { getPlatformContext, getPlatformWaitUntil } from "@/lib/platform/context";

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
const CACHE_INDEX_KEY = "@cache:index";

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
        return null;
    }
}

function safeParse<T>(value: string | null): T | null {
    if (value === null) {
        return null;
    }
    try {
        return JSON.parse(value) as T;
    } catch (error) {
        console.warn("[cache] failed to parse value", { error });
        return null;
    }
}

async function indexCacheKey(redis: Redis, key: string) {
    try {
        await redis.sadd(CACHE_INDEX_KEY, key);
    } catch (error) {
        console.warn("[cache] failed to index key", { key, error });
    }
}

async function removeIndexedKey(redis: Redis, key: string) {
    try {
        await redis.srem(CACHE_INDEX_KEY, key);
    } catch (error) {
        console.warn("[cache] failed to clean index", { key, error });
    }
}

async function resolveRedisForEnv<Env extends CacheEnv>(env?: Env) {
    const providedEnv = env;
    if (providedEnv) {
        return getRedisClient(providedEnv);
    }

    const context = await getPlatformContext({ async: true });
    return getRedisClient(context.env as CacheEnv | undefined);
}

async function invalidateUsingIndexedSet(redis: Redis, prefix: string) {
    const members = await redis.smembers<string[]>(CACHE_INDEX_KEY);
    const keys = Array.isArray(members) ? members : [];
    const targets = keys.filter((key) => key.startsWith(prefix));
    if (targets.length === 0) {
        return;
    }

    await Promise.allSettled(
        targets.map(async (key) => {
            await redis.del(key);
            await removeIndexedKey(redis, key);
        }),
    );
}

async function invalidateUsingScan(redis: Redis, prefix: string) {
    const deletions: Promise<unknown>[] = [];
    let cursor = "0";
    const pattern = `${prefix}*`;

    do {
        const [nextCursor, rawKeys]: [string, string[]] = await redis.scan(
            cursor,
            { match: pattern, count: 100 },
        );
        const keys = Array.isArray(rawKeys) ? rawKeys : [];
        for (const key of keys) {
            if (typeof key !== "string" || !key) {
                continue;
            }
            deletions.push(
                redis
                    .del(key)
                    .then(() => removeIndexedKey(redis, key))
                    .catch((error) =>
                        console.warn("[cache] failed to delete key", {
                            key,
                            error,
                        }),
                    ),
            );
        }
        cursor = nextCursor;
    } while (cursor !== "0");

    if (deletions.length > 0) {
        await Promise.allSettled(deletions);
    }
}

async function invalidateByPrefix(redis: Redis, prefix: string) {
    if (typeof redis.scan === "function") {
        await invalidateUsingScan(redis, prefix);
        return;
    }

    await invalidateUsingIndexedSet(redis, prefix);
}

export async function withApiCache<T, Env extends CacheEnv = CacheEnv>(
    options: WithCacheOptions<Env>,
    compute: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
    const { key, ttlSeconds, waitUntil } = options;
    if (!key) {
        const value = await compute();
        return { value, hit: false };
    }

    const providedEnv = options.env;
    const context = providedEnv
        ? undefined
        : await getPlatformContext({ async: true });
    const env = providedEnv ?? (context?.env as CacheEnv | undefined) ?? undefined;
    const redis = getRedisClient(env);
    if (!redis) {
        const value = await compute();
        return { value, hit: false };
    }

    try {
        const cached = await redis.get<string>(key);
        const parsed = safeParse<T>(cached ?? null);
        if (parsed !== null) {
            return { value: parsed, hit: true };
        }
    } catch (error) {
        console.warn("[cache] failed to read", { key, error });
    }

    const value = await compute();
    const serialized = safeStringify(value);
    if (serialized !== null) {
        const persist = redis
            .set(key, serialized, { ex: ttlSeconds })
            .then(async (result) => {
                if (result === "OK") {
                    await indexCacheKey(redis, key);
                }
            });
        const asyncWaiter =
            waitUntil ??
            (context?.ctx
                ? context.ctx.waitUntil.bind(context.ctx)
                : await getPlatformWaitUntil({ async: true }));
        if (asyncWaiter) {
            asyncWaiter(persist);
        } else {
            persist.catch((error) =>
                console.warn("[cache] failed to persist", { key, error }),
            );
        }
    }

    return { value, hit: false };
}

export async function invalidateApiCache<Env extends CacheEnv = CacheEnv>(
    prefix: string,
    env?: Env,
): Promise<void> {
    if (!prefix) {
        return;
    }

    const redis = await resolveRedisForEnv(env);
    if (!redis) {
        return;
    }

    try {
        await invalidateByPrefix(redis, prefix);
    } catch (error) {
        console.warn("[cache] failed to invalidate keys", { prefix, error });
    }
}
