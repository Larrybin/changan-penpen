import { NextResponse } from "next/server";

import { withApiCache } from "@/lib/cache";

const DEFAULT_CACHE_CONTROL = "private, max-age=0, must-revalidate";

function stableSerialize(params: Record<string, unknown> | undefined): string {
    if (!params) {
        return "{}";
    }

    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .sort(([left], [right]) => left.localeCompare(right));

    return JSON.stringify(Object.fromEntries(entries));
}

export interface AdminCacheKeyInput {
    resource: string;
    scope?: string;
    params?: Record<string, unknown>;
}

export function buildAdminCacheKey(input: AdminCacheKeyInput): string {
    const scope = input.scope ? `${input.scope}|` : "";
    return `admin:${scope}${input.resource}|${stableSerialize(input.params)}`;
}

export interface AdminCacheComputeOptions {
    ttlSeconds: number;
    waitUntil?: (promise: Promise<unknown>) => void;
}

export async function computeWithAdminCache<T>(
    keyInput: AdminCacheKeyInput,
    options: AdminCacheComputeOptions,
    compute: () => Promise<T>,
): Promise<{ key: string; value: T; hit: boolean }> {
    const key = buildAdminCacheKey(keyInput);
    const { value, hit } = await withApiCache(
        { key, ttlSeconds: options.ttlSeconds, waitUntil: options.waitUntil },
        compute,
    );

    return { key, value, hit };
}

export interface CachedResponseMetadata {
    hit: boolean;
    cacheControl?: string;
    headers?: Record<string, string>;
}

export function createAdminCachedJsonResponse<T>(
    data: T,
    metadata: CachedResponseMetadata,
) {
    const response = NextResponse.json(data);
    response.headers.set("X-Cache", metadata.hit ? "HIT" : "MISS");
    response.headers.set(
        "Cache-Control",
        metadata.cacheControl ?? DEFAULT_CACHE_CONTROL,
    );

    if (metadata.headers) {
        for (const [key, value] of Object.entries(metadata.headers)) {
            response.headers.set(key, value);
        }
    }

    return response;
}
