import { z } from "zod/v4";

import "@/lib/openapi/extend";
import { ApiError } from "@/lib/http-error";
import { recordApiRequestMetric } from "@/lib/observability/api-metrics";
import { isFaultEnabled as isGlobalFaultEnabled } from "@/lib/observability/fault-injection";
import { recordMetric } from "@/lib/observability/metrics";
import { retry } from "@/lib/utils/retry";

const CIRCUIT_BREAKER_STORE_KEY = "__summarizerCircuitBreakerStore__" as const;

type CircuitBreakerStateName = "closed" | "open" | "half-open";

type CircuitBreakerState = {
    state: CircuitBreakerStateName;
    failureCount: number;
    nextAttemptAt: number;
    halfOpenActiveCalls: number;
};

type CircuitBreakerStore = Map<string, CircuitBreakerState>;

type CircuitBreakerConfig = {
    enabled?: boolean;
    failureThreshold?: number;
    recoveryTimeoutMs?: number;
    halfOpenMaxCalls?: number;
};

type CircuitBreakerLease = {
    allowed: boolean;
    error?: Error;
    onSuccess: () => void;
    onFailure: () => void;
    release: () => void;
};

class CircuitBreakerOpenError extends ApiError {
    public readonly state: CircuitBreakerStateName;
    public readonly retryAfterMs?: number;

    constructor(
        public readonly breakerKey: string,
        state: CircuitBreakerStateName,
        retryAfterMs?: number,
    ) {
        super(
            retryAfterMs && retryAfterMs > 0
                ? `Circuit breaker "${breakerKey}" is ${state}; retry after ${retryAfterMs}ms`
                : `Circuit breaker "${breakerKey}" is ${state}`,
            {
                status: 503,
                code: "CIRCUIT_BREAKER_OPEN",
                severity: "high",
                details: {
                    breaker: breakerKey,
                    state,
                    retryAfterMs,
                },
            },
        );
        this.name = "CircuitBreakerOpenError";
        this.state = state;
        this.retryAfterMs = retryAfterMs;
    }

    override toResponse(options?: {
        headers?: HeadersInit;
        timestamp?: string;
    }): Response {
        const headers = new Headers(options?.headers);
        if (this.retryAfterMs !== undefined) {
            const seconds = Math.max(0, Math.ceil(this.retryAfterMs / 1000));
            headers.set("Retry-After", seconds.toString());
        }

        return super.toResponse({
            ...options,
            headers,
        });
    }
}

function getCircuitBreakerStore(): CircuitBreakerStore {
    const globalWithStore = globalThis as typeof globalThis & {
        [CIRCUIT_BREAKER_STORE_KEY]?: CircuitBreakerStore;
    };

    if (!globalWithStore[CIRCUIT_BREAKER_STORE_KEY]) {
        globalWithStore[CIRCUIT_BREAKER_STORE_KEY] = new Map();
    }

    return globalWithStore[CIRCUIT_BREAKER_STORE_KEY]!;
}

class CircuitBreaker {
    private readonly enabled: boolean;
    private readonly failureThreshold: number;
    private readonly recoveryTimeoutMs: number;
    private readonly halfOpenMaxCalls: number;
    private readonly store: CircuitBreakerStore;

    constructor(
        private readonly key: string,
        config: CircuitBreakerConfig,
    ) {
        this.enabled = config.enabled !== false;
        this.failureThreshold = Math.max(1, config.failureThreshold ?? 5);
        this.recoveryTimeoutMs = Math.max(1, config.recoveryTimeoutMs ?? 60_000);
        this.halfOpenMaxCalls = Math.max(1, config.halfOpenMaxCalls ?? 1);
        this.store = getCircuitBreakerStore();
    }

    acquire(): CircuitBreakerLease {
        if (!this.enabled) {
            return {
                allowed: true,
                onSuccess: () => {},
                onFailure: () => {},
                release: () => {},
            } satisfies CircuitBreakerLease;
        }

        const now = Date.now();
        let state = this.getState();

        if (state.state === "open") {
            if (now >= state.nextAttemptAt) {
                state = this.transitionToHalfOpen(state);
            } else {
                const retryAfterMs = Math.max(0, state.nextAttemptAt - now);
                const error = new CircuitBreakerOpenError(
                    this.key,
                    state.state,
                    retryAfterMs,
                );
                this.recordBlock(state.state, retryAfterMs);
                return {
                    allowed: false,
                    error,
                    onSuccess: () => {},
                    onFailure: () => {},
                    release: () => {},
                } satisfies CircuitBreakerLease;
            }
        }

        if (state.state === "half-open") {
            if (state.halfOpenActiveCalls >= this.halfOpenMaxCalls) {
                const error = new CircuitBreakerOpenError(this.key, state.state);
                this.recordBlock(state.state);
                return {
                    allowed: false,
                    error,
                    onSuccess: () => {},
                    onFailure: () => {},
                    release: () => {},
                } satisfies CircuitBreakerLease;
            }

            state.halfOpenActiveCalls += 1;
            this.setState(state);
            return {
                allowed: true,
                onSuccess: () => this.recordSuccess(true),
                onFailure: () => this.recordFailure(true),
                release: () => this.releaseHalfOpenSlot(),
            } satisfies CircuitBreakerLease;
        }

        this.setState(state);
        return {
            allowed: true,
            onSuccess: () => this.recordSuccess(false),
            onFailure: () => this.recordFailure(false),
            release: () => {},
        } satisfies CircuitBreakerLease;
    }

    private getState(): CircuitBreakerState {
        const state = this.store.get(this.key);
        if (state) {
            return { ...state };
        }

        const initial: CircuitBreakerState = {
            state: "closed",
            failureCount: 0,
            nextAttemptAt: 0,
            halfOpenActiveCalls: 0,
        };
        this.store.set(this.key, initial);
        return { ...initial };
    }

    private setState(state: CircuitBreakerState): void {
        this.store.set(this.key, { ...state });
    }

    private transitionToHalfOpen(previous: CircuitBreakerState): CircuitBreakerState {
        if (previous.state !== "half-open") {
            this.logStateChange("half-open");
        }

        const nextState: CircuitBreakerState = {
            state: "half-open",
            failureCount: 0,
            nextAttemptAt: 0,
            halfOpenActiveCalls: 0,
        };
        this.setState(nextState);
        return nextState;
    }

    private transitionToOpen(): void {
        const nextAttemptAt = Date.now() + this.recoveryTimeoutMs;
        this.logStateChange("open", { nextAttemptAt });
        this.setState({
            state: "open",
            failureCount: 0,
            nextAttemptAt,
            halfOpenActiveCalls: 0,
        });
    }

    private transitionToClosed(previous: CircuitBreakerState): void {
        if (previous.state !== "closed" || previous.failureCount > 0) {
            this.logStateChange("closed");
        }

        this.setState({
            state: "closed",
            failureCount: 0,
            nextAttemptAt: 0,
            halfOpenActiveCalls: 0,
        });
    }

    private recordSuccess(fromHalfOpen: boolean): void {
        if (!this.enabled) {
            return;
        }

        const state = this.getState();
        if (fromHalfOpen || state.state !== "closed" || state.failureCount > 0) {
            this.transitionToClosed(state);
            return;
        }

        if (state.failureCount !== 0) {
            state.failureCount = 0;
            this.setState(state);
        }
    }

    private recordFailure(fromHalfOpen: boolean): void {
        if (!this.enabled) {
            return;
        }

        const state = this.getState();

        if (fromHalfOpen) {
            this.transitionToOpen();
            return;
        }

        const failures = state.failureCount + 1;
        if (failures >= this.failureThreshold) {
            this.transitionToOpen();
            return;
        }

        state.failureCount = failures;
        this.setState(state);
    }

    private releaseHalfOpenSlot(): void {
        const state = this.getState();
        if (state.state !== "half-open") {
            return;
        }

        const active = Math.max(0, state.halfOpenActiveCalls - 1);
        if (active === state.halfOpenActiveCalls) {
            return;
        }

        state.halfOpenActiveCalls = active;
        this.setState(state);
    }

    private logStateChange(
        state: CircuitBreakerStateName,
        extra: Record<string, unknown> = {},
    ): void {
        const payload = { breaker: this.key, state, ...extra };
        if (state === "open") {
            console.warn("[SummarizerCircuitBreaker] state change", payload);
        } else {
            console.info("[SummarizerCircuitBreaker] state change", payload);
        }
        recordMetric("ai.summarizer.circuit_breaker.transition", 1, {
            breaker: this.key,
            state,
        });
    }

    private recordBlock(
        state: CircuitBreakerStateName,
        retryAfterMs?: number,
    ): void {
        console.warn("[SummarizerCircuitBreaker] request blocked", {
            breaker: this.key,
            state,
            retryAfterMs,
        });
        recordMetric("ai.summarizer.circuit_breaker.blocked", 1, {
            breaker: this.key,
            state,
        });
    }
}

export const summarizerConfigSchema = z
    .object({
        maxLength: z
            .number()
            .int()
            .min(50)
            .max(1000)
            .optional()
            .default(200)
            .openapi({
                description: "限制摘要的最大词数",
                example: 200,
            }),
        style: z
            .enum(["concise", "detailed", "bullet-points"])
            .optional()
            .default("concise")
            .openapi({
                description: "摘要风格",
                example: "concise",
            }),
        language: z
            .string()
            .min(1)
            .max(50)
            .optional()
            .default("English")
            .openapi({
                description: "摘要输出语言",
                example: "English",
            }),
    })
    .openapi("SummarizerConfig", {
        description: "Workers AI 摘要可选配置",
    });

export const summarizeRequestSchema = z
    .object({
        text: z
            .string()
            .trim()
            .min(50, "Text too short to summarize (minimum 50 characters)")
            .max(50000, "Text too long (maximum 50,000 characters)")
            .openapi({
                description: "待摘要的原文内容",
                example:
                    "OpenAI announced a new suite of tools designed to make AI development more accessible...",
            }),
        config: summarizerConfigSchema.optional().openapi({
            description: "可选的摘要配置。如果缺省则使用默认值。",
        }),
    })
    .openapi("SummarizeRequest", {
        description: "AI 摘要接口的请求负载",
    });

type SummaryStyles = z.infer<typeof summarizerConfigSchema>["style"];
export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>;
export type SummarizerConfig = z.infer<typeof summarizerConfigSchema>;
export const summaryResultSchema = z
    .object({
        summary: z
            .string()
            .openapi({ example: "The announcement introduces new tooling..." }),
        originalLength: z
            .number()
            .int()
            .openapi({ description: "原文字符数", example: 1024 }),
        summaryLength: z
            .number()
            .int()
            .openapi({ description: "摘要字符数", example: 256 }),
        tokensUsed: z
            .object({
                input: z
                    .number()
                    .int()
                    .openapi({ description: "输入估算 token", example: 350 }),
                output: z
                    .number()
                    .int()
                    .openapi({ description: "输出估算 token", example: 90 }),
            })
            .openapi({ description: "估算 token 消耗" }),
    })
    .openapi("SummaryResult", {
        description: "AI 摘要接口成功返回的数据结构",
    });

export type SummaryResult = z.infer<typeof summaryResultSchema>;

// 采用结构化约束，避免对全局 Ai 类型的硬依赖
export type AiRunResult = { response?: string } & Record<string, unknown>;
export type AiBinding = {
    run: (model: string, options: unknown) => Promise<AiRunResult>;
};

export interface SummarizerServiceOptions {
    retry?: {
        attempts?: number;
        initialDelayMs?: number;
        backoffFactor?: number;
    };
    circuitBreaker?: CircuitBreakerConfig & { key?: string };
    faultInjection?: {
        flags: readonly string[];
    };
}

export class SummarizerService {
    private readonly faultFlags?: Set<string>;
    private readonly circuitBreaker?: CircuitBreaker;

    constructor(
        private readonly ai: AiBinding,
        private readonly options: SummarizerServiceOptions = {},
    ) {
        const flags = this.options.faultInjection?.flags ?? [];
        if (flags.length > 0) {
            this.faultFlags = new Set(
                flags
                    .map((flag) => flag.trim())
                    .filter((flag) => flag.length > 0),
            );
        }

        if (this.options.circuitBreaker && this.options.circuitBreaker.enabled !== false) {
            const { key, ...config } = this.options.circuitBreaker;
            const breakerKey = key ?? "summarizer.workers-ai";
            this.circuitBreaker = new CircuitBreaker(breakerKey, config);
        }
    }

    async summarize(
        text: string,
        config?: SummarizerConfig,
    ): Promise<SummaryResult> {
        const {
            maxLength = 200,
            style = "concise",
            language = "English",
        } = config || {};

        const systemPrompt = this.buildSystemPrompt(maxLength, style, language);

        // Estimate tokens (rough calculation: 1 token ≈ 4 characters)
        const inputTokens = Math.ceil((systemPrompt.length + text.length) / 4);

        const requestMessages = [
            { role: "system" as const, content: systemPrompt },
            {
                role: "user" as const,
                content: `Please summarize the following text: ${text}`,
            },
        ];

        this.maybeInjectFault("summarizer.before-run");

        try {
            const summary = await retry(
                async () => {
                    const lease = this.circuitBreaker?.acquire();
                    if (lease && !lease.allowed) {
                        lease.release();
                        throw lease.error;
                    }

                    this.maybeInjectFault("summarizer.retry-attempt");
                    const usesHighResTimer =
                        typeof performance !== "undefined" &&
                        typeof performance.now === "function";
                    const startedAt = usesHighResTimer
                        ? performance.now()
                        : Date.now();
                    try {
                        const result = await this.ai.run(
                            "@cf/meta/llama-3.2-1b-instruct",
                            { messages: requestMessages },
                        );
                        const output = result.response?.trim();
                        if (!output) {
                            const emptyError = new Error(
                                "Empty response received from AI binding",
                            );
                            (emptyError as { status?: number }).status = 502;
                            throw emptyError;
                        }

                        const durationMs = usesHighResTimer
                            ? performance.now() - startedAt
                            : Date.now() - startedAt;
                        recordApiRequestMetric({
                            route: "@cf/meta/llama-3.2-1b-instruct",
                            method: "POST",
                            status: 200,
                            durationMs,
                            service: "workers-ai",
                        });
                        lease?.onSuccess();
                        return output;
                    } catch (error) {
                        const durationMs = usesHighResTimer
                            ? performance.now() - startedAt
                            : Date.now() - startedAt;
                        const status = this.extractStatus(error) ?? 500;
                        recordApiRequestMetric({
                            route: "@cf/meta/llama-3.2-1b-instruct",
                            method: "POST",
                            status,
                            durationMs,
                            service: "workers-ai",
                        });
                        lease?.onFailure();
                        throw error;
                    } finally {
                        lease?.release();
                    }
                },
                {
                    attempts: Math.max(1, this.options.retry?.attempts ?? 3),
                    initialDelayMs: this.options.retry?.initialDelayMs ?? 250,
                    backoffFactor: this.options.retry?.backoffFactor ?? 2,
                    shouldRetry: (error) =>
                        !(error instanceof CircuitBreakerOpenError) &&
                        this.isTransientError(error),
                    onRetry: ({ error, attempt }) => {
                        console.warn("[SummarizerService] retrying summarize", {
                            attempt,
                            error,
                        });
                    },
                },
            );

            const outputTokens = Math.ceil(summary.length / 4);
            recordMetric("ai.summarizer.outcome", 1, {
                result: "success",
                status: 200,
                style,
                language,
            });
            this.maybeInjectFault("summarizer.after-run");

            return {
                summary,
                originalLength: text.length,
                summaryLength: summary.length,
                tokensUsed: {
                    input: inputTokens,
                    output: outputTokens,
                },
            } satisfies SummaryResult;
        } catch (error) {
            if (error instanceof CircuitBreakerOpenError) {
                throw error;
            }
            console.error("[SummarizerService] summarize failed", { error });
            const fallback = this.buildFallbackSummary(text, maxLength);
            const outputTokens = Math.ceil(fallback.length / 4);
            const status = this.extractStatus(error) ?? "unknown";
            recordMetric("ai.summarizer.outcome", 1, {
                result: "fallback",
                status,
                style,
                language,
            });
            this.maybeInjectFault("summarizer.fallback");

            return {
                summary: fallback,
                originalLength: text.length,
                summaryLength: fallback.length,
                tokensUsed: {
                    input: inputTokens,
                    output: outputTokens,
                },
            } satisfies SummaryResult;
        }
    }

    private buildSystemPrompt(
        maxLength: number,
        style: SummaryStyles,
        language: string,
    ): string {
        const styleInstructions: Record<SummaryStyles, string> = {
            concise:
                "Create a brief, concise summary focusing on the main points.",
            detailed:
                "Create a comprehensive summary that covers key details and context.",
            "bullet-points":
                "Create a summary using bullet points to highlight key information.",
        };

        return `You are a professional text summarizer. ${styleInstructions[style]}

                Instructions:
                    - Summarize in ${language}
                    - Keep the summary under ${maxLength} words
                    - Focus on the most important information
                    - Maintain the original meaning and context
                    - Use clear, readable language
                    - Do not add your own opinions or interpretations
                    - DO NOT START THE SUMMARY WITH the following phrases:
                        - "Here is a summary of the text"
                        - "Here is a summary of the text:"
                        - "Here is a summary of the text in bullet points"
                        - "Here is the summary:"
                        - "Here is the summary in bullet points:"
                        - "Here is the summary in ${language}:"
                        - "Here is the summary in ${language} in bullet points:"

                Output only the summary, nothing else.`;
    }

    private isTransientError(error: unknown): boolean {
        const status = this.extractStatus(error);
        if (status === null) {
            return true;
        }

        return status >= 500 || status === 429;
    }

    private extractStatus(error: unknown): number | null {
        if (!error || typeof error !== "object") {
            return null;
        }

        if (typeof (error as { status?: unknown }).status === "number") {
            return (error as { status: number }).status;
        }

        const response = (error as { response?: { status?: number } }).response;
        if (response && typeof response.status === "number") {
            return response.status;
        }

        return null;
    }

    private buildFallbackSummary(text: string, maxLength: number): string {
        const trimmed = text.trim();
        if (!trimmed) {
            return "Summary is temporarily unavailable.";
        }

        const sentences = trimmed.split(/(?<=[.!?。！？])\s+/u).filter(Boolean);
        const candidate = sentences.slice(0, 3).join(" ") || trimmed;
        const maxChars = Math.max(100, maxLength * 6);
        const truncated =
            candidate.length > maxChars
                ? `${candidate.slice(0, maxChars - 1).trimEnd()}…`
                : candidate;

        return truncated;
    }

    private maybeInjectFault(identifier: string, error?: () => Error): void {
        if (!this.isFaultEnabled(identifier)) {
            return;
        }

        throw error ? error() : new Error(`[fault-injection] ${identifier}`);
    }

    private isFaultEnabled(identifier: string): boolean {
        if (this.faultFlags && this.faultFlags.size > 0) {
            if (this.faultFlags.has("*") || this.faultFlags.has(identifier)) {
                return true;
            }
        }

        return isGlobalFaultEnabled(identifier);
    }
}
