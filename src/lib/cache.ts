import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Redis } from "@upstash/redis/cloudflare";

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

const redisClients = new Map<string, Redis>();

function getRedisClient(env: CacheEnv | undefined): Redis | null {
    const url = env?.UPSTASH_REDIS_REST_URL;
    const token = env?.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        return null;
    }
    const cacheKey = `${url}::${token}`;
    let client = redisClients.get(cacheKey);
    if (client) {
        return client;
    }
    client = new Redis({ url, token });
    redisClients.set(cacheKey, client);
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
    const context = providedEnv
        ? null
        : await getCloudflareContext({ async: true }).catch(() => null);
    const env =
        providedEnv ?? (context?.env as CacheEnv | undefined) ?? undefined;
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
        const asyncWaiter =
            waitUntil ?? context?.ctx?.waitUntil?.bind(context.ctx);
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
