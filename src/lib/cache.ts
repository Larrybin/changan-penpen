import { Redis } from "@upstash/redis/cloudflare";

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
    const platformContext = providedEnv
        ? undefined
        : await getPlatformContext({ async: true });
    const env =
        providedEnv ??
        (platformContext?.env as CacheEnv | undefined) ??
        undefined;
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
        const persist = redis.set(key, serialized, { ex: ttlSeconds });
        let asyncWaiter = waitUntil ?? platformContext?.waitUntil;
        if (!asyncWaiter) {
            asyncWaiter = await getPlatformWaitUntil({ async: true });
        }
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
