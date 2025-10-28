import { config } from "@/config";
import handleApiError from "@/lib/api-error";
import { getMultiLevelCache } from "@/lib/cache/multi-level-cache";
import { createApiErrorResponse } from "@/lib/http-error";
import { parseFaultInjectionTargets } from "@/lib/observability/fault-injection";
import { getPlatformContext } from "@/lib/platform/context";
import { applyRateLimit } from "@/lib/rate-limit";
import type { RateLimitMetadata } from "@/lib/rate-limit";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import type {
    AiBinding,
    SummarizerConfig,
    SummaryResult,
} from "@/services/summarizer.service";
import {
    SummarizerService,
    summarizeRequestSchema,
} from "@/services/summarizer.service";

const SUMMARY_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const SUMMARY_CACHE_HEADER = "X-Summary-Cache";

interface SessionUser {
    id: string;
    email?: string | null;
}

interface AuthenticatedSession {
    user: SessionUser;
}

type AuthenticationResult =
    | { ok: true; session: AuthenticatedSession }
    | { ok: false; response: Response };

type RateLimiterEnv = Parameters<typeof applyRateLimit>[0]["env"];

type PlatformResolutionResult =
    | {
          ok: true;
          resources: {
              rateLimiterEnv: RateLimiterEnv;
              waitUntil: ((promise: Promise<unknown>) => void) | undefined;
              ai: AiBinding;
          };
      }
    | { ok: false; response: Response };

type CacheInstance = Awaited<ReturnType<typeof getMultiLevelCache>>;

async function digestSha256(value: string): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(value).digest("hex");
}

function normalizeConfig(
    config: SummarizerConfig | undefined,
): Record<string, unknown> {
    if (!config) {
        return {};
    }

    const entries = Object.entries(config).filter(
        ([, value]) => value !== undefined,
    );
    entries.sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries);
}

async function buildSummaryCacheKey(
    userId: string,
    text: string,
    config: SummarizerConfig | undefined,
): Promise<string> {
    const normalizedText = text.trim();
    const normalizedConfig = normalizeConfig(config);
    const serialized = JSON.stringify({
        text: normalizedText,
        config: normalizedConfig,
    });
    const hash = await digestSha256(serialized);
    return `summaries:${userId}:${hash}`;
}

async function authenticateRequest(
    request: Request,
): Promise<AuthenticationResult> {
    const auth = await getAuthInstance();
    const session = (await auth.api.getSession({
        headers: request.headers,
    })) as AuthenticatedSession | null;

    if (!session?.user || typeof session.user.id !== "string") {
        return {
            ok: false,
            response: createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
                severity: "high",
            }),
        };
    }

    return { ok: true, session };
}

function hasAI(env: unknown): env is { AI: AiBinding } {
    try {
        const record = env as Record<string, unknown> | null | undefined;
        const ai = (record?.AI ?? undefined) as { run?: unknown } | undefined;
        return Boolean(ai && typeof ai.run === "function");
    } catch {
        return false;
    }
}

async function resolvePlatformResources(): Promise<PlatformResolutionResult> {
    const { env, waitUntil } = await getPlatformContext({ async: true });

    if (!hasAI(env)) {
        return {
            ok: false,
            response: createApiErrorResponse({
                status: 503,
                code: "SERVICE_UNAVAILABLE",
                message: "AI service is not available",
                severity: "high",
            }),
        };
    }

    return {
        ok: true,
        resources: {
            rateLimiterEnv: env as RateLimiterEnv,
            waitUntil,
            ai: env.AI,
        },
    };
}

async function parseSummarizeRequest(request: Request) {
    const body = await request.json();
    const validated = summarizeRequestSchema.parse(body);
    return {
        normalizedText: validated.text.trim(),
        config: validated.config,
    };
}

function createSummaryResponse(
    payload: SummaryResult,
    cacheStatus: "HIT" | "MISS",
    headers?: HeadersInit,
) {
    const responseHeaders = new Headers(headers);
    responseHeaders.set("Content-Type", "application/json");
    responseHeaders.set(SUMMARY_CACHE_HEADER, cacheStatus);

    return new Response(
        JSON.stringify({
            success: true,
            data: payload,
            error: null,
        }),
        {
            status: 200,
            headers: responseHeaders,
        },
    );
}

async function readCachedSummary(cache: CacheInstance, cacheKey: string) {
    const cached = await cache.getValue(cacheKey);
    if (!cached.value) {
        return null;
    }

    try {
        const parsed = JSON.parse(cached.value) as SummaryResult;
        return createSummaryResponse(parsed, "HIT");
    } catch (parseError) {
        console.warn("[summarize] failed to parse cached summary", {
            cacheKey,
            error: parseError,
        });
        return null;
    }
}

async function writeSummaryToCache(
    cache: CacheInstance,
    cacheKey: string,
    summary: SummaryResult,
) {
    try {
        await cache.setValue(cacheKey, JSON.stringify(summary), {
            ttlSeconds: SUMMARY_CACHE_TTL_SECONDS,
        });
    } catch (cacheError) {
        console.warn("[summarize] failed to write summary to cache", {
            cacheKey,
            error: cacheError,
        });
    }
}

function applyRateLimitHeaders(
    headers: Headers,
    meta: RateLimitMetadata | undefined,
) {
    if (!meta) {
        return;
    }

    if (meta.limit !== undefined) {
        headers.set("X-RateLimit-Limit", String(meta.limit));
    }
    if (meta.remaining !== undefined) {
        headers.set(
            "X-RateLimit-Remaining",
            String(Math.max(0, meta.remaining)),
        );
    }
    if (meta.reset !== undefined) {
        const resetValue =
            meta.reset instanceof Date
                ? Math.ceil(meta.reset.getTime() / 1000)
                : meta.reset;
        headers.set("X-RateLimit-Reset", String(resetValue));
    }
}

function createSummarizerServiceInstance(
    ai: AiBinding,
    faultTargets: string[],
) {
    const externalApiConfig = config.services?.external_apis;
    const circuitBreakerConfig = externalApiConfig?.circuit_breaker;
    const circuitBreakerOptions = circuitBreakerConfig
        ? {
              key: "summarizer:workers-ai",
              enabled: circuitBreakerConfig.enabled ?? true,
              failureThreshold:
                  circuitBreakerConfig.failure_threshold ?? undefined,
              recoveryTimeout:
                  circuitBreakerConfig.recovery_timeout ?? undefined,
              halfOpenMaxCalls:
                  circuitBreakerConfig.half_open_max_calls ?? undefined,
          }
        : undefined;

    return new SummarizerService(ai, {
        retry: {
            attempts: externalApiConfig?.retry_attempts ?? 3,
            backoffFactor: 2,
            initialDelayMs: 250,
        },
        faultInjection:
            faultTargets.length > 0 ? { flags: faultTargets } : undefined,
        circuitBreaker: circuitBreakerOptions,
    });
}

export async function POST(request: Request) {
    try {
        const authentication = await authenticateRequest(request);
        if (!authentication.ok) {
            return authentication.response;
        }

        const platform = await resolvePlatformResources();
        if (!platform.ok) {
            return platform.response;
        }

        const { normalizedText, config: requestConfig } =
            await parseSummarizeRequest(request);
        const cacheKey = await buildSummaryCacheKey(
            authentication.session.user.id,
            normalizedText,
            requestConfig,
        );
        const cache = await getMultiLevelCache();
        const cachedResponse = await readCachedSummary(cache, cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }

        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "api:summarize",
            keyParts: [
                authentication.session.user.id,
                authentication.session.user.email ?? null,
            ],
            env: platform.resources.rateLimiterEnv,
            waitUntil: platform.resources.waitUntil,
            upstash: {
                strategy: { type: "sliding", requests: 10, window: "1 m" },
                prefix: "summaries",
                includeHeaders: true,
            },
            message: "Too many summarize requests",
        });
        if (!rateLimitResult.ok) {
            return rateLimitResult.response;
        }

        const faultTargets = parseFaultInjectionTargets(
            request.headers.get("x-fault-injection"),
        );
        const summarizerService = createSummarizerServiceInstance(
            platform.resources.ai,
            faultTargets,
        );
        const result = await summarizerService.summarize(
            normalizedText,
            requestConfig,
        );

        await writeSummaryToCache(cache, cacheKey, result);

        const headers = new Headers();
        applyRateLimitHeaders(headers, rateLimitResult.meta);

        return createSummaryResponse(result, "MISS", headers);
    } catch (error) {
        return handleApiError(error);
    }
}
