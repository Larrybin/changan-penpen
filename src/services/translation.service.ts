export type TranslationProviderName = "gemini" | "gpt";

export type TranslationEntry = {
    key: string;
    text: string;
    description?: string;
};

export type TranslationBatchRequest = {
    entries: TranslationEntry[];
    sourceLocale: string;
    targetLocale: string;
    format?: "plain" | "markdown" | "html";
    tone?: string;
};

export type TranslationResult = {
    key: string;
    translatedText: string;
};

export interface TranslationProvider {
    translateBatch(
        request: TranslationBatchRequest,
    ): Promise<TranslationResult[]>;
}

export class TranslationError extends Error {
    readonly retriable: boolean;

    constructor(
        message: string,
        options: { cause?: unknown; retriable?: boolean } = {},
    ) {
        super(
            message,
            options.cause !== undefined ? { cause: options.cause } : undefined,
        );
        this.name = "TranslationError";
        this.retriable = options.retriable ?? false;
    }
}

const DEFAULT_RETRY_ATTEMPTS = 2;
const MAX_ENTRIES_PER_BATCH = 50;
const MAX_TOTAL_CHARACTERS = 12_000;
const REQUEST_TIMEOUT_MS = 30_000;

export class TranslationService {
    constructor(private readonly provider: TranslationProvider) {}

    async translateBatch(
        request: TranslationBatchRequest,
    ): Promise<TranslationResult[]> {
        if (request.entries.length === 0) {
            return [];
        }

        validateBatchRequest(request);

        let attempt = 0;
        let lastError: unknown;

        while (attempt <= DEFAULT_RETRY_ATTEMPTS) {
            try {
                return await this.provider.translateBatch(request);
            } catch (error) {
                lastError = error;
                attempt += 1;
                if (
                    attempt > DEFAULT_RETRY_ATTEMPTS ||
                    !isRetriableError(error)
                ) {
                    break;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, 500 * attempt),
                );
            }
        }

        throw new TranslationError("Failed to translate batch after retries", {
            cause: lastError,
        });
    }
}

type EnvRecord = Record<string, string | undefined>;

const DEFAULT_GEMINI_MODEL = "models/gemini-1.5-pro-latest";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = (
    sourceLocale: string,
    targetLocale: string,
    _format: TranslationBatchRequest["format"],
    tone?: string,
) => `You are a professional localization specialist. Translate the provided entries from ${sourceLocale} to ${targetLocale}.

Output requirements:
- Respond with valid JSON only. Use the exact input keys.
- Preserve Markdown/HTML tags, emojis, placeholders (e.g. {name}, {{value}}, <b>...</b>).
- Keep punctuation, spacing, variables, and array ordering intact.
- Use natural, localized phrasing suitable for ${tone ?? "general audiences"}.
- Do not explain the translation or include additional commentary.`;

const buildUserPrompt = (entries: TranslationEntry[]) => {
    const data = entries
        .map((entry) => ({
            key: entry.key,
            text: entry.text,
            description: entry.description,
        }))
        .map((entry) =>
            Object.fromEntries(
                Object.entries(entry).filter(
                    ([, value]) => value !== undefined && value !== "",
                ),
            ),
        );

    return `Translate the following entries and respond with JSON mapping keys to translated strings.\n${JSON.stringify(
        data,
        null,
        2,
    )}`;
};

const CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;

const extractCodeFence = (text: string) => {
    const match = text.match(CODE_FENCE_PATTERN);
    return match?.[1]?.trim() ?? null;
};

const CHAR_CODES = {
    quote: 34,
    backslash: 92,
    openBrace: 123,
    closeBrace: 125,
} as const;

type BraceScannerState = {
    depth: number;
    inString: boolean;
    escaping: boolean;
};

const handleStringCharacter = (state: BraceScannerState, code: number) => {
    if (state.escaping) {
        state.escaping = false;
        return;
    }
    if (code === CHAR_CODES.backslash) {
        state.escaping = true;
        return;
    }
    if (code === CHAR_CODES.quote) state.inString = false;
};

const handleBraceCharacter = (state: BraceScannerState, code: number) => {
    if (code === CHAR_CODES.quote) {
        state.inString = true;
        return;
    }
    if (code === CHAR_CODES.openBrace) {
        state.depth += 1;
        return;
    }
    if (code === CHAR_CODES.closeBrace) state.depth -= 1;
};

const findBalancedClosingBrace = (text: string, start: number) => {
    const state: BraceScannerState = {
        depth: 0,
        inString: false,
        escaping: false,
    };
    for (let i = start; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (state.inString) {
            handleStringCharacter(state, code);
            continue;
        }
        handleBraceCharacter(state, code);
        if (state.depth === 0 && code === CHAR_CODES.closeBrace) return i;
    }
    return null;
};

const extractBalancedJsonObject = (text: string) => {
    const start = text.indexOf("{");
    if (start === -1) return null;
    const end = findBalancedClosingBrace(text, start);
    return end === null ? null : text.slice(start, end + 1);
};

const isStringRecord = (value: unknown): value is Record<string, string> => {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    return Object.values(value).every((entry) => typeof entry === "string");
};

type JsonCandidateResult = {
    value: Record<string, string> | null;
    error?: unknown;
};

const tryParseCandidate = (candidate: string): JsonCandidateResult => {
    try {
        const parsed = JSON.parse(candidate);
        return { value: isStringRecord(parsed) ? parsed : null };
    } catch (error) {
        return { value: null, error };
    }
};

const collectJsonCandidates = (raw: string) => {
    const trimmed = raw.trim();
    const candidates = new Set<string>();
    if (trimmed) candidates.add(trimmed);
    const fenced = extractCodeFence(trimmed);
    if (fenced) candidates.add(fenced.trim());
    if (!trimmed.startsWith("{")) {
        const balanced = extractBalancedJsonObject(trimmed);
        if (balanced) candidates.add(balanced.trim());
    }
    return { trimmed, candidates: Array.from(candidates) };
};

const parseJsonResponse = (raw: string): Record<string, string> => {
    const { trimmed, candidates } = collectJsonCandidates(raw);
    const errors: unknown[] = [];
    for (const candidate of candidates) {
        const { value, error } = tryParseCandidate(candidate);
        if (value) return value;
        if (error) errors.push(error);
    }
    throw new TranslationError("Unable to parse JSON translation response", {
        cause: { raw: trimmed, errors },
    });
};

class GeminiTranslationProvider implements TranslationProvider {
    constructor(
        private readonly apiKey: string,
        private readonly model: string,
    ) {}

    async translateBatch(
        request: TranslationBatchRequest,
    ): Promise<TranslationResult[]> {
        const {
            entries,
            sourceLocale,
            targetLocale,
            format = "plain",
            tone,
        } = request;
        const url = new URL(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
        );
        url.searchParams.set("key", this.apiKey);

        const body = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${SYSTEM_PROMPT(sourceLocale, targetLocale, format, tone)}\n\n${buildUserPrompt(entries)}`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
            },
        } satisfies Record<string, unknown>;

        const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            timeout: REQUEST_TIMEOUT_MS,
        });

        if (!response.ok) {
            throw new TranslationError(
                `Gemini API request failed: ${response.status} ${response.statusText}`,
                { retriable: isRetriableStatus(response.status) },
            );
        }

        const payload = (await response.json()) as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
            }>;
        };
        const text =
            payload.candidates?.[0]?.content?.parts
                ?.map((part) => part.text ?? "")
                .join("")
                ?.trim() ?? "";

        if (!text) {
            throw new TranslationError("Gemini API returned empty response", {
                retriable: true,
            });
        }

        const parsed = parseJsonResponse(text);
        return entries.map((entry) => ({
            key: entry.key,
            translatedText: parsed[entry.key] ?? entry.text,
        }));
    }
}

class OpenAiTranslationProvider implements TranslationProvider {
    constructor(
        private readonly apiKey: string,
        private readonly model: string,
        private readonly baseUrl = "https://api.openai.com/v1",
    ) {}

    async translateBatch(
        request: TranslationBatchRequest,
    ): Promise<TranslationResult[]> {
        const {
            entries,
            sourceLocale,
            targetLocale,
            format = "plain",
            tone,
        } = request;
        const body = {
            model: this.model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT(
                        sourceLocale,
                        targetLocale,
                        format,
                        tone,
                    ),
                },
                {
                    role: "user",
                    content: buildUserPrompt(entries),
                },
            ],
        } satisfies Record<string, unknown>;

        const response = await fetchWithTimeout(
            `${this.baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
                timeout: REQUEST_TIMEOUT_MS,
            },
        );

        if (!response.ok) {
            throw new TranslationError(
                `OpenAI API request failed: ${response.status} ${response.statusText}`,
                { retriable: isRetriableStatus(response.status) },
            );
        }

        const payload = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const text = payload.choices?.[0]?.message?.content?.trim();

        if (!text) {
            throw new TranslationError("OpenAI API returned empty response", {
                retriable: true,
            });
        }

        const parsed = parseJsonResponse(text);
        return entries.map((entry) => ({
            key: entry.key,
            translatedText: parsed[entry.key] ?? entry.text,
        }));
    }
}

export type TranslationServiceOptions = {
    provider?: TranslationProviderName;
    gemini?: {
        apiKey?: string;
        model?: string;
    };
    openai?: {
        apiKey?: string;
        model?: string;
        baseUrl?: string;
    };
};

export const createTranslationServiceFromEnv = (
    env: EnvRecord,
    overrides: TranslationServiceOptions = {},
): TranslationService => {
    const providerName =
        overrides.provider ??
        (env.TRANSLATION_PROVIDER as TranslationProviderName | undefined) ??
        "gemini";

    if (providerName === "gemini") {
        const apiKey = overrides.gemini?.apiKey ?? env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new TranslationError(
                "GEMINI_API_KEY is required for Gemini translation provider",
            );
        }
        const model =
            overrides.gemini?.model ?? env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
        return new TranslationService(
            new GeminiTranslationProvider(apiKey, model),
        );
    }

    if (providerName === "gpt") {
        const apiKey = overrides.openai?.apiKey ?? env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new TranslationError(
                "OPENAI_API_KEY is required for GPT translation provider",
            );
        }
        const model =
            overrides.openai?.model ??
            env.OPENAI_TRANSLATION_MODEL ??
            DEFAULT_OPENAI_MODEL;
        const baseUrl =
            overrides.openai?.baseUrl ??
            env.OPENAI_BASE_URL ??
            "https://api.openai.com/v1";
        return new TranslationService(
            new OpenAiTranslationProvider(apiKey, model, baseUrl),
        );
    }

    throw new TranslationError(
        `Unsupported translation provider: ${providerName}`,
    );
};

export const NEEDS_REVIEW_MARKERS = [
    "待更新",
    "__NEEDS_REVIEW__",
    "__REVIEW__",
];

function validateBatchRequest(request: TranslationBatchRequest) {
    if (request.entries.length > MAX_ENTRIES_PER_BATCH) {
        throw new TranslationError(
            `Batch size exceeds limit of ${MAX_ENTRIES_PER_BATCH} entries`,
        );
    }

    const totalCharacters = request.entries.reduce((total, entry) => {
        return (
            total + (entry.text?.length ?? 0) + (entry.description?.length ?? 0)
        );
    }, 0);

    if (totalCharacters > MAX_TOTAL_CHARACTERS) {
        throw new TranslationError(
            `Batch payload exceeds ${MAX_TOTAL_CHARACTERS} characters`,
        );
    }
}

function isRetriableError(error: unknown): boolean {
    if (error instanceof TranslationError) {
        return error.retriable;
    }
    return true;
}

function isRetriableStatus(status: number) {
    return status === 429 || status >= 500;
}

async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit & { timeout?: number },
) {
    const controller = new AbortController();
    const { timeout = REQUEST_TIMEOUT_MS, ...rest } = init;
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        return await fetch(input, { ...rest, signal: controller.signal });
    } catch (error) {
        if ((error as Error)?.name === "AbortError") {
            throw new TranslationError("Translation request timed out", {
                cause: error,
                retriable: true,
            });
        }
        throw new TranslationError("Translation request failed", {
            cause: error,
            retriable: true,
        });
    } finally {
        clearTimeout(id);
    }
}
