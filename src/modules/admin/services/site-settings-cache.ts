interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

const CACHE_KEY = "site-settings";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const cacheStore = new Map<string, CacheEntry<any>>();

export function getCachedSiteSettings<T>() {
    const entry = cacheStore.get(CACHE_KEY) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cacheStore.delete(CACHE_KEY);
        return null;
    }
    return entry.value;
}

export function setCachedSiteSettings<T>(value: T) {
    cacheStore.set(CACHE_KEY, {
        value,
        expiresAt: Date.now() + CACHE_TTL,
    });
}

export function clearSiteSettingsCache() {
    cacheStore.delete(CACHE_KEY);
}
