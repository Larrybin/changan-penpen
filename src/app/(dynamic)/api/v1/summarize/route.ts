import { config } from "@/config";
import { getMultiLevelCache } from "@/lib/cache/multi-level-cache";
import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { parseFaultInjectionTargets } from "@/lib/observability/fault-injection";
import { parseDurationToMs } from "@/lib/utils/duration";
import { getPlatformContext } from "@/lib/platform/context";
import { applyRateLimit } from "@/lib/rate-limit";
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

async function digestSha256(value: string): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    const { createHash } = await import("crypto");
    return createHash("sha256").update(value).digest("hex");
}

function normalizeConfig(config: SummarizerConfig | undefined): Record<string, unknown> {
    if (!config) {
        return {};
    }

    const entries = Object.entries(config).filter(([, value]) => value !== undefined);
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
    const serialized = JSON.stringify({ text: normalizedText, config: normalizedConfig });
    const hash = await digestSha256(serialized);
    return `summaries:${userId}:${hash}`;
}

export async function POST(request: Request) {
    try {
        // Check authentication
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
                severity: "high",
            });
        }

        const { env, waitUntil } = await getPlatformContext({ async: true });

        function hasAI(e: unknown): e is { AI: AiBinding } {
            try {
                const rec = e as Record<string, unknown> | null | undefined;
                const aiVal = rec
                    ? (rec as Record<string, unknown>).AI
                    : undefined;
                const ai = aiVal as { run?: unknown } | undefined;
                return Boolean(ai && typeof ai.run === "function");
            } catch {
                return false;
            }
        }

        if (!hasAI(env)) {
            return createApiErrorResponse({
                status: 503,
                code: "SERVICE_UNAVAILABLE",
                message: "AI service is not available",
                severity: "high",
            });
        }

        // parse request body
        const body = await request.json();
        const validated = summarizeRequestSchema.parse(body);
        const normalizedText = validated.text.trim();

        const cacheKey = await buildSummaryCacheKey(
            session.user.id,
            normalizedText,
            validated.config,
        );
        const cache = await getMultiLevelCache();
        const cached = await cache.getValue(cacheKey);

        if (cached.value) {
            try {
                const parsed = JSON.parse(cached.value) as SummaryResult;
                return new Response(
                    JSON.stringify({
                        success: true,
                        data: parsed,
                        error: null,
                    }),
                    {
                        status: 200,
                        headers: {
                            "Content-Type": "application/json",
                            [SUMMARY_CACHE_HEADER]: "HIT",
                        },
                    },
                );
            } catch (parseError) {
                console.warn("[summarize] failed to parse cached summary", {
                    cacheKey,
                    error: parseError,
                });
            }
        }

        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "api:summarize",
            keyParts: [session.user.id, session.user.email ?? null],
            env,
            waitUntil,
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

        const faultHeader = request.headers.get("x-fault-injection");
        const faultTargets = parseFaultInjectionTargets(faultHeader);

        const retryConfig = config.services?.external_apis;
        const circuitBreakerConfig = retryConfig?.circuit_breaker;
        const summarizerService = new SummarizerService(env.AI, {
            retry: {
                attempts: externalApiConfig?.retry_attempts ?? 3,
                backoffFactor: 2,
                initialDelayMs: 250,
            },
            circuitBreaker: circuitBreakerConfig
                ? {
                      key: "summarizer.workers-ai",
                      enabled: circuitBreakerConfig.enabled,
                      failureThreshold: circuitBreakerConfig.failure_threshold,
                      recoveryTimeoutMs: parseDurationToMs(
                          circuitBreakerConfig.recovery_timeout,
                      ),
                      halfOpenMaxCalls: circuitBreakerConfig.half_open_max_calls,
                  }
                : undefined,
            faultInjection:
                faultTargets.length > 0 ? { flags: faultTargets } : undefined,
            circuitBreaker: circuitBreakerConfig
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
                : undefined,
        });
        const result = await summarizerService.summarize(
            normalizedText,
            validated.config,
        );

        try {
            await cache.setValue(cacheKey, JSON.stringify(result), {
                ttlSeconds: SUMMARY_CACHE_TTL_SECONDS,
            });
        } catch (cacheError) {
            console.warn("[summarize] failed to write summary to cache", {
                cacheKey,
                error: cacheError,
            });
        }

        const headers = new Headers({
            "Content-Type": "application/json",
            [SUMMARY_CACHE_HEADER]: "MISS",
        });

        if (rateLimitResult.meta) {
            if (rateLimitResult.meta.limit !== undefined) {
                headers.set("X-RateLimit-Limit", String(rateLimitResult.meta.limit));
            }
            if (rateLimitResult.meta.remaining !== undefined) {
                headers.set(
                    "X-RateLimit-Remaining",
                    String(Math.max(0, rateLimitResult.meta.remaining)),
                );
            }
            if (rateLimitResult.meta.reset !== undefined) {
                const resetValue =
                    rateLimitResult.meta.reset instanceof Date
                        ? Math.ceil(rateLimitResult.meta.reset.getTime() / 1000)
                        : rateLimitResult.meta.reset;
                headers.set("X-RateLimit-Reset", String(resetValue));
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
                error: null,
            }),
            {
                status: 200,
                headers,
            },
        );
    } catch (error) {
        return handleApiError(error);
    }
}
