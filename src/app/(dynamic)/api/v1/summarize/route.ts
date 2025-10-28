import { config } from "@/config";
import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { parseFaultInjectionTargets } from "@/lib/observability/fault-injection";
import { parseDurationToMs } from "@/lib/utils/duration";
import { getPlatformContext } from "@/lib/platform/context";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import type { AiBinding } from "@/services/summarizer.service";
import {
    SummarizerService,
    summarizeRequestSchema,
} from "@/services/summarizer.service";

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

        const { env } = await getPlatformContext({ async: true });

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

        const faultHeader = request.headers.get("x-fault-injection");
        const faultTargets = parseFaultInjectionTargets(faultHeader);

        const externalApiConfig = config.services?.external_apis;
        const circuitBreakerConfig = externalApiConfig?.circuit_breaker;
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
        });
        const result = await summarizerService.summarize(
            validated.text,
            validated.config,
        );

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
                error: null,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error) {
        return handleApiError(error);
    }
}
