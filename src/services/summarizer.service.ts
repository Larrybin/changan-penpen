import { z } from "zod/v4";

import "@/lib/openapi/extend";
import { recordApiRequestMetric } from "@/lib/observability/api-metrics";
import { isFaultEnabled as isGlobalFaultEnabled } from "@/lib/observability/fault-injection";
import { recordMetric } from "@/lib/observability/metrics";
import { retry } from "@/lib/utils/retry";

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
    faultInjection?: {
        flags: readonly string[];
    };
    circuitBreaker?: SummarizerCircuitBreakerOptions;
}

type CircuitBreakerState = "closed" | "open" | "half_open";

interface CircuitBreakerInternalState {
    state: CircuitBreakerState;
    failureCount: number;
    openedAt: number | null;
    halfOpenInFlight: number;
}

interface CircuitBreakerResolvedConfig {
    key: string;
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxCalls: number;
}

export interface SummarizerCircuitBreakerOptions {
    key?: string;
    enabled?: boolean;
    failureThreshold?: number;
    recoveryTimeout?: string | number;
    recoveryTimeoutMs?: number;
    halfOpenMaxCalls?: number;
}

class CircuitBreakerOpenError extends Error {
    status = 503;
    code = "CIRCUIT_BREAKER_OPEN";

    constructor(message = "Circuit breaker is open") {
        super(message);
        this.name = "CircuitBreakerOpenError";
    }
}

const CIRCUIT_BREAKER_STATES = new Map<string, CircuitBreakerInternalState>();
const CIRCUIT_BREAKER_REGISTRY = new Map<string, CircuitBreaker>();

class CircuitBreaker {
    private config: CircuitBreakerResolvedConfig;
    private readonly state: CircuitBreakerInternalState;

    constructor(config: CircuitBreakerResolvedConfig) {
        this.config = config;
        const existingState = CIRCUIT_BREAKER_STATES.get(config.key);
        if (existingState) {
            this.state = existingState;
        } else {
            this.state = {
                state: "closed",
                failureCount: 0,
                openedAt: null,
                halfOpenInFlight: 0,
            };
            CIRCUIT_BREAKER_STATES.set(config.key, this.state);
        }
    }

    updateConfig(config: CircuitBreakerResolvedConfig): void {
        this.config = config;
    }

    ensureCanAttempt(): void {
        if (!this.config.enabled) {
            return;
        }

        if (this.state.state === "open") {
            const now = Date.now();
            if (
                this.state.openedAt !== null &&
                now - this.state.openedAt >= this.config.recoveryTimeoutMs
            ) {
                return;
            }
            this.onBlocked(this.state.state);
            throw new CircuitBreakerOpenError();
        }

        if (this.state.state === "half_open") {
            const limit = Math.max(1, this.config.halfOpenMaxCalls);
            if (this.state.halfOpenInFlight >= limit) {
                this.onBlocked(this.state.state);
                throw new CircuitBreakerOpenError();
            }
        }
    }

    beforeRequest(): () => void {
        if (!this.config.enabled) {
            return () => {};
        }

        this.ensureCanAttempt();

        if (this.state.state === "open") {
            this.transitionTo("half_open");
        }

        if (this.state.state === "half_open") {
            this.state.halfOpenInFlight += 1;
            return () => {
                this.state.halfOpenInFlight = Math.max(
                    0,
                    this.state.halfOpenInFlight - 1,
                );
            };
        }

        return () => {};
    }

    recordSuccess(): void {
        if (!this.config.enabled) {
            return;
        }

        if (this.state.state === "half_open") {
            this.transitionTo("closed");
            return;
        }

        if (this.state.state === "closed") {
            this.state.failureCount = 0;
        }
    }

    recordFailure(): void {
        if (!this.config.enabled) {
            return;
        }

        if (this.state.state === "half_open") {
            this.transitionTo("open");
            return;
        }

        this.state.failureCount += 1;
        if (this.state.failureCount >= this.config.failureThreshold) {
            this.transitionTo("open");
        }
    }

    private onBlocked(state: CircuitBreakerState): void {
        recordMetric("ai.summarizer.circuit_breaker.blocked", 1, {
            state,
            key: this.config.key,
        });
        console.warn("[CircuitBreaker] request blocked", {
            state,
            key: this.config.key,
        });
    }

    private transitionTo(next: CircuitBreakerState): void {
        if (this.state.state === next) {
            return;
        }

        this.state.state = next;
        switch (next) {
            case "open":
                this.state.failureCount = 0;
                this.state.openedAt = Date.now();
                this.state.halfOpenInFlight = 0;
                break;
            case "half_open":
                this.state.failureCount = 0;
                this.state.openedAt = null;
                this.state.halfOpenInFlight = 0;
                break;
            case "closed":
                this.state.failureCount = 0;
                this.state.openedAt = null;
                this.state.halfOpenInFlight = 0;
                break;
        }

        recordMetric("ai.summarizer.circuit_breaker.transition", 1, {
            state: next,
            key: this.config.key,
        });
        const logMethod = next === "open" ? console.error : console.info;
        logMethod("[CircuitBreaker] state transition", {
            state: next,
            key: this.config.key,
        });
    }
}

function parseDurationToMs(input?: string | number): number | undefined {
    if (typeof input === "number" && Number.isFinite(input)) {
        return input;
    }

    if (typeof input !== "string") {
        return undefined;
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return undefined;
    }

    const match = trimmed.match(/^(\d+)(ms|s|m)?$/i);
    if (!match) {
        return undefined;
    }

    const value = Number(match[1]);
    const unit = (match[2] ?? "s").toLowerCase();
    switch (unit) {
        case "ms":
            return value;
        case "m":
            return value * 60_000;
        case "s":
        default:
            return value * 1000;
    }
}

function normalizeCircuitBreakerOptions(
    options: SummarizerCircuitBreakerOptions | undefined,
): CircuitBreakerResolvedConfig | undefined {
    if (!options) {
        return undefined;
    }

    const enabled = options.enabled ?? true;
    if (!enabled) {
        return {
            key: options.key ?? "summarizer:workers-ai",
            enabled,
            failureThreshold: Math.max(1, options.failureThreshold ?? 5),
            recoveryTimeoutMs:
                options.recoveryTimeoutMs ??
                parseDurationToMs(options.recoveryTimeout) ??
                60_000,
            halfOpenMaxCalls: Math.max(1, options.halfOpenMaxCalls ?? 1),
        } satisfies CircuitBreakerResolvedConfig;
    }

    const failureThreshold = Math.max(1, options.failureThreshold ?? 5);
    const recoveryTimeoutMs =
        options.recoveryTimeoutMs ??
        parseDurationToMs(options.recoveryTimeout) ??
        60_000;
    const halfOpenMaxCalls = Math.max(1, options.halfOpenMaxCalls ?? 1);

    return {
        key: options.key ?? "summarizer:workers-ai",
        enabled,
        failureThreshold,
        recoveryTimeoutMs,
        halfOpenMaxCalls,
    } satisfies CircuitBreakerResolvedConfig;
}

function getCircuitBreaker(
    options: SummarizerCircuitBreakerOptions | undefined,
): CircuitBreaker | undefined {
    const normalized = normalizeCircuitBreakerOptions(options);
    if (!normalized) {
        return undefined;
    }

    const existing = CIRCUIT_BREAKER_REGISTRY.get(normalized.key);
    if (existing) {
        existing.updateConfig(normalized);
        return existing;
    }

    const breaker = new CircuitBreaker(normalized);
    CIRCUIT_BREAKER_REGISTRY.set(normalized.key, breaker);
    return breaker;
}

export class SummarizerService {
    private readonly faultFlags?: Set<string>;
    private readonly circuitBreaker?: CircuitBreaker;

    constructor(
        private readonly ai: AiBinding,
        private readonly options: SummarizerServiceOptions = {},
    ) {
        this.circuitBreaker = getCircuitBreaker(this.options.circuitBreaker);
        const flags = this.options.faultInjection?.flags ?? [];
        if (flags.length > 0) {
            this.faultFlags = new Set(
                flags
                    .map((flag) => flag.trim())
                    .filter((flag) => flag.length > 0),
            );
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
            this.circuitBreaker?.ensureCanAttempt();
            const summary = await retry(
                async () => {
                    const release = this.circuitBreaker?.beforeRequest();
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
                        this.circuitBreaker?.recordSuccess();
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
                        this.circuitBreaker?.recordFailure();
                        throw error;
                    } finally {
                        release?.();
                    }
                },
                {
                    attempts: Math.max(1, this.options.retry?.attempts ?? 3),
                    initialDelayMs: this.options.retry?.initialDelayMs ?? 250,
                    backoffFactor: this.options.retry?.backoffFactor ?? 2,
                    shouldRetry: (error) => {
                        if (error instanceof CircuitBreakerOpenError) {
                            return false;
                        }
                        return this.isTransientError(error);
                    },
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
