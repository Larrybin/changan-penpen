import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";

// Local re-definition to align with @upstash/ratelimit template literal type
type Unit = "ms" | "s" | "m" | "h" | "d";
type Duration = `${number} ${Unit}` | `${number}${Unit}`;

import { Redis } from "@upstash/redis/cloudflare";
import { createApiErrorResponse } from "@/lib/http-error";

interface RateLimitBinding {
    limit(options: { key: string }): Promise<{ success: boolean }>;
}

type RateLimiterEnv = {
    RATE_LIMITER?: RateLimitBinding;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
};

interface SlidingWindowStrategy {
    type: "sliding";
    requests: number;
    window: Duration;
}

interface FixedWindowStrategy {
    type: "fixed";
    requests: number;
    window: Duration;
}

interface TokenBucketStrategy {
    type: "tokenBucket";
    refillRate: number;
    interval: Duration;
    capacity: number;
}

export type UpstashRateLimitStrategy =
    | SlidingWindowStrategy
    | FixedWindowStrategy
    | TokenBucketStrategy;

export interface UpstashRateLimitOptions {
    strategy: UpstashRateLimitStrategy;
    prefix?: string;
    analytics?: boolean;
    includeHeaders?: boolean;
}

export interface ApplyRateLimitOptions {
    request: Request;
    identifier: string;
    uniqueToken?: string | null;
    keyParts?: Array<string | null | undefined>;
    env?: RateLimiterEnv;
    message?: string;
    upstash?: UpstashRateLimitOptions;
    waitUntil?: (promise: Promise<unknown>) => void;
}

export interface RateLimitMetadata {
    limit?: number;
    remaining?: number;
    reset?: Date | string | number;
}

export type ApplyRateLimitResult =
    | { ok: true; skipped: boolean; meta?: RateLimitMetadata }
    | { ok: false; response: Response };

const upstashLimiterCache = new Map<string, Ratelimit>();

function sanitizeKeyParts(parts: Array<string | null | undefined>): string[] {
    return parts
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part && part.length > 0));
}

function getClientIp(request: Request): string | null {
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    const trimmedCfConnectingIp = cfConnectingIp?.trim();
    if (trimmedCfConnectingIp) {
        return trimmedCfConnectingIp;
    }

    const xForwardedFor = request.headers.get("x-forwarded-for");
    const trimmedXForwardedFor = xForwardedFor?.trim();
    if (trimmedXForwardedFor) {
        const first = trimmedXForwardedFor.split(",")[0];
        if (first) {
            return first.trim();
        }
    }

    const realIp = request.headers.get("x-real-ip");
    const trimmedRealIp = realIp?.trim();
    if (trimmedRealIp) {
        return trimmedRealIp;
    }

    return null;
}

function resolveCompositeKey(
    request: Request,
    identifier: string,
    uniqueToken: string | null | undefined,
    keyParts?: Array<string | null | undefined>,
): string {
    const trimmedIdentifier = identifier.trim();
    const baseParts =
        keyParts && keyParts.length > 0
            ? sanitizeKeyParts(keyParts)
            : sanitizeKeyParts([
                  trimmedIdentifier,
                  uniqueToken ?? undefined,
                  getClientIp(request),
              ]);

    if (baseParts.length === 0) {
        return trimmedIdentifier || "";
    }

    return baseParts.join(":");
}

function buildLimiterCacheKey(
    identifier: string,
    options: UpstashRateLimitOptions,
): string {
    const base = {
        identifier,
        prefix: options.prefix ?? null,
        analytics: options.analytics ?? false,
        strategy: options.strategy,
    };
    return JSON.stringify(base);
}

function createLimiter(
    url: string,
    token: string,
    identifier: string,
    options: UpstashRateLimitOptions,
): Ratelimit {
    const redis = new Redis({ url, token });
    let limiterFactory: ReturnType<typeof Ratelimit.fixedWindow>;
    switch (options.strategy.type) {
        case "fixed":
            limiterFactory = Ratelimit.fixedWindow(
                options.strategy.requests,
                options.strategy.window,
            );
            break;
        case "sliding":
            limiterFactory = Ratelimit.slidingWindow(
                options.strategy.requests,
                options.strategy.window,
            );
            break;
        case "tokenBucket":
            limiterFactory = Ratelimit.tokenBucket(
                options.strategy.refillRate,
                options.strategy.interval,
                options.strategy.capacity,
            );
            break;
        default: {
            const exhaustive: never = options.strategy;
            throw new Error(`Unsupported rate limit strategy: ${exhaustive}`);
        }
    }

    const prefix = options.prefix ?? `@ratelimit/${identifier}`;
    return new Ratelimit({
        redis,
        limiter: limiterFactory,
        analytics: options.analytics ?? false,
        prefix,
    });
}

function ensureUpstashLimiter(
    env: RateLimiterEnv | undefined,
    identifier: string,
    options?: UpstashRateLimitOptions,
): Ratelimit | null {
    if (!options) {
        return null;
    }

    const url = env?.UPSTASH_REDIS_REST_URL;
    const token = env?.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        return null;
    }

    const cacheKey = buildLimiterCacheKey(identifier, options);
    const cached = upstashLimiterCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const limiter = createLimiter(url, token, identifier, options);
    upstashLimiterCache.set(cacheKey, limiter);
    return limiter;
}

function computeRetryAfterSeconds(
    reset?: Date | string | number,
): number | null {
    if (!reset) {
        return null;
    }

    if (reset instanceof Date) {
        return Math.max(0, Math.ceil((reset.getTime() - Date.now()) / 1000));
    }

    const parsed = Number(reset);
    if (!Number.isNaN(parsed)) {
        const nowSeconds = Math.ceil(Date.now() / 1000);
        return Math.max(0, Math.ceil(parsed - nowSeconds));
    }

    return null;
}

function buildUpstashErrorResponse(
    message: string | undefined,
    metadata: RateLimitMetadata,
    includeHeaders: boolean,
): Response {
    const headers = new Headers();
    const retryAfterSeconds = computeRetryAfterSeconds(metadata.reset);

    if (retryAfterSeconds !== null) {
        headers.set("Retry-After", String(retryAfterSeconds));
    }

    if (includeHeaders) {
        if (typeof metadata.limit === "number") {
            headers.set("X-RateLimit-Limit", String(metadata.limit));
        }
        if (typeof metadata.remaining === "number") {
            headers.set(
                "X-RateLimit-Remaining",
                String(Math.max(metadata.remaining, 0)),
            );
        }
        if (metadata.reset) {
            const resetValue =
                metadata.reset instanceof Date
                    ? Math.ceil(metadata.reset.getTime() / 1000)
                    : typeof metadata.reset === "number"
                      ? Math.ceil(metadata.reset / 1000)
                      : metadata.reset;
            headers.set("X-RateLimit-Reset", String(resetValue));
        }
    }

    const details = {
        limit: metadata.limit ?? null,
        remaining: metadata.remaining ?? null,
        reset:
            metadata.reset instanceof Date
                ? metadata.reset.toISOString()
                : (metadata.reset ?? null),
        retryAfterSeconds: retryAfterSeconds ?? null,
    } as const;

    return createApiErrorResponse({
        status: 429,
        code: "RATE_LIMITED",
        message: message || "Too many requests",
        details,
        headers,
    });
}

export async function applyRateLimit(
    options: ApplyRateLimitOptions,
): Promise<ApplyRateLimitResult> {
    const { request, identifier, uniqueToken, message, upstash, waitUntil } =
        options;

    const providedEnv = options.env;
    const asyncContext = providedEnv
        ? null
        : await getCloudflareContext({ async: true });
    const env = (providedEnv ?? asyncContext?.env) as
        | RateLimiterEnv
        | undefined;

    const compositeKey = resolveCompositeKey(
        request,
        identifier,
        uniqueToken,
        options.keyParts,
    );

    const limiter = ensureUpstashLimiter(env, identifier, upstash);
    if (limiter && upstash) {
        const result = await limiter.limit(compositeKey);
        if (result.pending) {
            if (typeof waitUntil === "function") {
                waitUntil(result.pending);
            } else {
                result.pending.catch((error: unknown) => {
                    console.warn("[rate-limit] pending analytics rejected", {
                        identifier,
                        error,
                    });
                });
            }
        }

        if (!result.success) {
            const response = buildUpstashErrorResponse(
                message,
                {
                    limit: result.limit,
                    remaining: result.remaining,
                    reset: result.reset,
                },
                upstash.includeHeaders ?? false,
            );
            return { ok: false, response };
        }

        return {
            ok: true,
            skipped: false,
            meta: {
                limit: result.limit,
                remaining: result.remaining,
                reset: result.reset,
            },
        };
    }

    const rateLimiter = env?.RATE_LIMITER;
    if (!rateLimiter || typeof rateLimiter.limit !== "function") {
        return { ok: true, skipped: true };
    }

    try {
        const outcome = await rateLimiter.limit({ key: compositeKey });
        if (outcome.success) {
            return { ok: true, skipped: false };
        }
    } catch (error: unknown) {
        console.warn("[rate-limit] failed to evaluate", {
            key: compositeKey,
            error,
        });
        return { ok: true, skipped: true };
    }

    return {
        ok: false,
        response: createApiErrorResponse({
            status: 429,
            code: "RATE_LIMITED",
            message: message || "Too many requests",
        }),
    };
}
