import { config } from "@/config";
import type { CacheConfig } from "@/config/types";
import { getPlatformContext } from "@/lib/platform/context";
import { getRedisClient } from "@/lib/cache";

interface KvNamespaceLike {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
}

interface CacheExecutionOverrides {
    env?: Record<string, unknown>;
    waitUntil?: (promise: Promise<unknown>) => void;
}

interface CacheReadOptions {
    strategy?: string;
    execution?: CacheExecutionOverrides;
}

interface CacheWriteOptions extends CacheReadOptions {
    ttlSeconds?: number;
}

interface CacheLayerAdapter {
    name: string;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds: number): Promise<void>;
    delete?(key: string): Promise<void>;
}

const DEFAULT_LAYER_ORDER = ["memory", "kv", "redis"] as const;

class MemoryCacheLayer implements CacheLayerAdapter {
    public readonly name = "memory";
    private readonly maxEntries: number;
    private store = new Map<string, { value: string; expiresAt: number }>();

    constructor(options: { maxEntries?: number }) {
        this.maxEntries = Math.max(1, options.maxEntries ?? 512);
    }

    private cleanup(now = Date.now()): void {
        for (const [key, entry] of this.store) {
            if (entry.expiresAt > 0 && entry.expiresAt <= now) {
                this.store.delete(key);
            }
        }
        while (this.store.size > this.maxEntries) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey) {
                this.store.delete(oldestKey);
            } else {
                break;
            }
        }
    }

    async get(key: string): Promise<string | null> {
        const now = Date.now();
        this.cleanup(now);
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt > 0 && entry.expiresAt <= now) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
        this.store.set(key, { value, expiresAt });
        this.cleanup();
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }
}

class KvCacheLayer implements CacheLayerAdapter {
    public readonly name = "kv";
    constructor(private readonly namespace: KvNamespaceLike) {}

    async get(key: string): Promise<string | null> {
        try {
            return await this.namespace.get(key);
        } catch (error) {
            console.warn("[cache] KV get failed", { key, error });
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        try {
            const ttl = Math.max(0, Math.floor(ttlSeconds));
            if (ttl > 0) {
                await this.namespace.put(key, value, { expirationTtl: ttl });
            } else {
                await this.namespace.put(key, value);
            }
        } catch (error) {
            console.warn("[cache] KV set failed", { key, error });
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.namespace.delete(key);
        } catch (error) {
            console.warn("[cache] KV delete failed", { key, error });
        }
    }
}

class RedisCacheLayer implements CacheLayerAdapter {
    public readonly name = "redis";

    constructor(private readonly env?: Record<string, unknown>) {}

    private async resolveClient() {
        return getRedisClient(this.env as { [key: string]: unknown } | undefined);
    }

    async get(key: string): Promise<string | null> {
        try {
            const client = await this.resolveClient();
            if (!client) return null;
            return (await client.get<string>(key)) ?? null;
        } catch (error) {
            console.warn("[cache] redis get failed", { key, error });
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds: number): Promise<void> {
        try {
            const client = await this.resolveClient();
            if (!client) return;
            const ttl = Math.max(0, Math.floor(ttlSeconds));
            if (ttl > 0) {
                await client.set(key, value, { ex: ttl });
            } else {
                await client.set(key, value);
            }
        } catch (error) {
            console.warn("[cache] redis set failed", { key, error });
        }
    }

    async delete(key: string): Promise<void> {
        try {
            const client = await this.resolveClient();
            if (!client) return;
            await client.del(key);
        } catch (error) {
            console.warn("[cache] redis delete failed", { key, error });
        }
    }
}

interface ResolvedStrategy {
    layers: string[];
    keyPrefix: string;
    ttlByLayer: Map<string, number>;
}

const defaultSerializer = {
    serialize<T>(value: T): string | null {
        try {
            return JSON.stringify(value);
        } catch (error) {
            console.warn("[cache] serialize failed", { error });
            return null;
        }
    },
    deserialize<T>(value: string): T | null {
        try {
            return JSON.parse(value) as T;
        } catch (error) {
            console.warn("[cache] deserialize failed", { error });
            return null;
        }
    },
};

class MultiLevelCache {
    private readonly cacheConfig: CacheConfig;
    private readonly memoryLayer: MemoryCacheLayer;
    private adapters = new Map<string, CacheLayerAdapter | null>();
    private readonly layersConfig: Record<string, { ttlSeconds?: number; enabled?: boolean; binding?: string; maxEntries?: number }>;
    private readonly defaultLayers: string[];
    private readonly strategyKeyIndex = new Map<string, Set<string>>();

    constructor(cacheConfig: CacheConfig) {
        this.cacheConfig = cacheConfig;
        this.layersConfig = cacheConfig.layers ?? {};
        this.memoryLayer = new MemoryCacheLayer({
            maxEntries: this.layersConfig.memory?.maxEntries,
        });
        this.adapters.set(
            "memory",
            this.layersConfig.memory?.enabled === false ? null : this.memoryLayer,
        );
        this.defaultLayers = this.computeDefaultLayers();
    }

    private strategyIndexKey(strategyName?: string): string {
        return strategyName ?? "__default__";
    }

    private trackKey(strategyName: string | undefined, key: string): void {
        const indexKey = this.strategyIndexKey(strategyName);
        let keys = this.strategyKeyIndex.get(indexKey);
        if (!keys) {
            keys = new Set<string>();
            this.strategyKeyIndex.set(indexKey, keys);
        }
        keys.add(key);
    }

    private untrackKey(strategyName: string | undefined, key: string): void {
        const indexKey = this.strategyIndexKey(strategyName);
        const keys = this.strategyKeyIndex.get(indexKey);
        if (!keys) {
            return;
        }
        keys.delete(key);
        if (keys.size === 0) {
            this.strategyKeyIndex.delete(indexKey);
        }
    }

    private computeDefaultLayers(): string[] {
        const configured = Object.keys(this.layersConfig).filter((name) => {
            const layer = this.layersConfig[name];
            return layer?.enabled !== false;
        });
        const ordered = DEFAULT_LAYER_ORDER.filter((layer) => configured.includes(layer));
        const extras = configured.filter(
            (layer) => !DEFAULT_LAYER_ORDER.includes(layer as typeof DEFAULT_LAYER_ORDER[number]),
        );
        return [...ordered, ...extras];
    }

    private async resolveExecution(
        overrides?: CacheExecutionOverrides,
    ): Promise<{ env?: Record<string, unknown>; waitUntil?: (promise: Promise<unknown>) => void }> {
        if (overrides?.env || overrides?.waitUntil) {
            return {
                env: overrides.env,
                waitUntil: overrides.waitUntil,
            };
        }
        const context = await getPlatformContext({ async: true });
        return {
            env: context.env,
            waitUntil: context.ctx?.waitUntil?.bind(context.ctx),
        };
    }

    private resolveStrategy(name?: string): ResolvedStrategy {
        const strategies = this.cacheConfig.strategies ?? {};
        const strategyConfig = name ? strategies[name] : undefined;
        const layers = (strategyConfig?.layers ?? this.defaultLayers).filter((layer) => {
            const layerConfig = this.layersConfig[layer];
            if (!layerConfig) return true;
            return layerConfig.enabled !== false;
        });
        const prefix = strategyConfig?.keyPrefix ?? (name ? name.replace(/\s+/g, ":") : "cache");
        const ttlByLayer = new Map<string, number>();
        layers.forEach((layer) => {
            const override = strategyConfig?.ttlSeconds?.[layer];
            const layerDefault = this.layersConfig[layer]?.ttlSeconds;
            const ttl = override ?? layerDefault ?? this.cacheConfig.defaultTtlSeconds;
            ttlByLayer.set(layer, Math.max(0, ttl));
        });
        return { layers, keyPrefix: prefix, ttlByLayer };
    }

    private buildKey(prefix: string, key: string): string {
        if (!prefix) {
            return key;
        }
        return `${prefix}:${key}`;
    }

    private async resolveAdapter(
        layerName: string,
        env?: Record<string, unknown>,
    ): Promise<CacheLayerAdapter | null> {
        if (this.adapters.has(layerName)) {
            return this.adapters.get(layerName) ?? null;
        }

        if (layerName === "memory") {
            this.adapters.set(layerName, this.memoryLayer);
            return this.memoryLayer;
        }

        if (layerName === "kv") {
            const binding = this.layersConfig.kv?.binding;
            if (!binding) {
                this.adapters.set(layerName, null);
                return null;
            }
            const namespace = env?.[binding];
            if (
                namespace &&
                typeof (namespace as KvNamespaceLike).get === "function" &&
                typeof (namespace as KvNamespaceLike).put === "function"
            ) {
                const layer = new KvCacheLayer(namespace as KvNamespaceLike);
                this.adapters.set(layerName, layer);
                return layer;
            }
            console.warn("[cache] KV namespace not available", { binding });
            this.adapters.set(layerName, null);
            return null;
        }

        if (layerName === "redis") {
            const layer = new RedisCacheLayer(env);
            this.adapters.set(layerName, layer);
            return layer;
        }

        this.adapters.set(layerName, null);
        return null;
    }

    private schedule(
        promises: Promise<unknown>[],
        waitUntil?: (promise: Promise<unknown>) => void,
    ): void {
        if (promises.length === 0) {
            return;
        }
        const aggregate = Promise.allSettled(promises).then(() => undefined);
        if (waitUntil) {
            waitUntil(aggregate);
        } else {
            aggregate.catch((error) => {
                console.warn("[cache] background cache operation failed", { error });
            });
        }
    }

    async getValue(
        key: string,
        options?: CacheReadOptions,
    ): Promise<{ value: string | null; strategy: ResolvedStrategy }> {
        const execution = await this.resolveExecution(options?.execution);
        const strategy = this.resolveStrategy(options?.strategy);
        if (strategy.layers.length === 0) {
            return { value: null, strategy };
        }
        const composedKey = this.buildKey(strategy.keyPrefix, key);
        let cachedValue: string | null = null;
        let hitLayerIndex = -1;
        for (let index = 0; index < strategy.layers.length; index++) {
            const layerName = strategy.layers[index];
            const adapter = await this.resolveAdapter(layerName, execution.env);
            if (!adapter) {
                continue;
            }
            const raw = await adapter.get(composedKey);
            if (raw !== null) {
                cachedValue = raw;
                hitLayerIndex = index;
                break;
            }
        }

        if (cachedValue !== null && hitLayerIndex > 0) {
            const warmupPromises: Promise<unknown>[] = [];
            for (let i = 0; i < hitLayerIndex; i++) {
                const layerName = strategy.layers[i];
                const adapter = await this.resolveAdapter(layerName, execution.env);
                if (!adapter) continue;
                const ttl = strategy.ttlByLayer.get(layerName) ?? this.cacheConfig.defaultTtlSeconds;
                warmupPromises.push(adapter.set(composedKey, cachedValue, ttl));
            }
            this.schedule(warmupPromises, execution.waitUntil);
        }

        return { value: cachedValue, strategy };
    }

    async setValue(
        key: string,
        value: string,
        options?: CacheWriteOptions,
    ): Promise<void> {
        const execution = await this.resolveExecution(options?.execution);
        const strategy = this.resolveStrategy(options?.strategy);
        if (strategy.layers.length === 0) {
            return;
        }
        const composedKey = this.buildKey(strategy.keyPrefix, key);
        const ttlOverride = options?.ttlSeconds;
        const tasks: Promise<unknown>[] = [];
        for (const layerName of strategy.layers) {
            const adapter = await this.resolveAdapter(layerName, execution.env);
            if (!adapter) continue;
            const ttl = ttlOverride ?? strategy.ttlByLayer.get(layerName) ?? this.cacheConfig.defaultTtlSeconds;
            tasks.push(adapter.set(composedKey, value, ttl));
        }
        this.schedule(tasks, execution.waitUntil);
        this.trackKey(options?.strategy, key);
    }

    async deleteValue(key: string, options?: CacheReadOptions): Promise<void> {
        const execution = await this.resolveExecution(options?.execution);
        const strategy = this.resolveStrategy(options?.strategy);
        if (strategy.layers.length === 0) {
            return;
        }
        const composedKey = this.buildKey(strategy.keyPrefix, key);
        const tasks: Promise<unknown>[] = [];
        for (const layerName of strategy.layers) {
            const adapter = await this.resolveAdapter(layerName, execution.env);
            if (!adapter || typeof adapter.delete !== "function") {
                continue;
            }
            tasks.push(adapter.delete(composedKey));
        }
        this.schedule(tasks, execution.waitUntil);
        this.untrackKey(options?.strategy, key);
    }

    async invalidateStrategy(
        strategyName: string,
        predicate?: (key: string) => boolean,
    ): Promise<number> {
        const indexKey = this.strategyIndexKey(strategyName);
        const trackedKeys = this.strategyKeyIndex.get(indexKey);
        if (!trackedKeys || trackedKeys.size === 0) {
            return 0;
        }
        const keys = Array.from(trackedKeys);
        let invalidated = 0;
        for (const key of keys) {
            if (predicate && !predicate(key)) {
                continue;
            }
            await this.deleteValue(key, { strategy: strategyName });
            invalidated += 1;
        }
        return invalidated;
    }
}

let sharedCache: MultiLevelCache | null = null;

export async function getMultiLevelCache(): Promise<MultiLevelCache> {
    if (!sharedCache) {
        sharedCache = new MultiLevelCache(config.cache);
    }
    return sharedCache;
}

export async function readThroughMultiLevelCache<T>(
    key: string,
    compute: () => Promise<T>,
    options?: CacheWriteOptions & {
        serializer?: {
            serialize(value: T): string | null;
            deserialize(serialized: string): T | null;
        };
    },
): Promise<{ value: T; hit: boolean }> {
    const cache = await getMultiLevelCache();
    const serializer = options?.serializer ?? defaultSerializer;
    const cached = await cache.getValue(key, options);
    if (cached.value !== null) {
        const parsed = serializer.deserialize<T>(cached.value);
        if (parsed !== null) {
            return { value: parsed, hit: true };
        }
    }
    const computed = await compute();
    const serialized = serializer.serialize(computed);
    if (serialized !== null) {
        await cache.setValue(key, serialized, options);
    }
    return { value: computed, hit: false };
}

export async function deleteFromMultiLevelCache(
    key: string,
    options?: CacheReadOptions,
): Promise<void> {
    const cache = await getMultiLevelCache();
    await cache.deleteValue(key, options);
}

export async function invalidateMultiLevelCacheStrategy(
    strategyName: string,
    options?: { predicate?: (key: string) => boolean },
): Promise<number> {
    const cache = await getMultiLevelCache();
    return cache.invalidateStrategy(strategyName, options?.predicate);
}
