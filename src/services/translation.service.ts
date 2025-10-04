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
    constructor(
        message: string,
        readonly cause?: unknown,
    ) {
        super(message);
        this.name = "TranslationError";
    }
}

const DEFAULT_RETRY_ATTEMPTS = 2;

export class TranslationService {
    constructor(private readonly provider: TranslationProvider) {}

    async translateBatch(
        request: TranslationBatchRequest,
    ): Promise<TranslationResult[]> {
        if (request.entries.length === 0) {
            return [];
        }

        let attempt = 0;
        let lastError: unknown;

        while (attempt <= DEFAULT_RETRY_ATTEMPTS) {
            try {
                return await this.provider.translateBatch(request);
            } catch (error) {
                lastError = error;
                attempt += 1;
                if (attempt > DEFAULT_RETRY_ATTEMPTS) {
                    break;
                }
                await new Promise((resolve) =>
                    setTimeout(resolve, 500 * attempt),
                );
            }
        }

        throw new TranslationError(
            "Failed to translate batch after retries",
            lastError,
        );
    }
}

type EnvRecord = Record<string, string | undefined>;

const DEFAULT_GEMINI_MODEL = "models/gemini-1.5-pro-latest";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = (
    sourceLocale: string,
    targetLocale: string,
    format: TranslationBatchRequest["format"],
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

    return `Translate the following entries and respond with JSON mapping keys to translated strings.\n${JSON.stringify(data, null, 2)}`;
};

const parseJsonResponse = (raw: string): Record<string, string> => {
    const trimmed = raw.trim();
    const candidates = [trimmed];

    if (!trimmed.startsWith("{")) {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (match) {
            candidates.push(match[0]);
        }
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate);
            return parsed as Record<string, string>;
        } catch (error) {
            continue;
        }
    }

    throw new TranslationError(
        "Unable to parse JSON translation response",
        trimmed,
    );
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

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new TranslationError(
                `Gemini API request failed: ${response.status} ${response.statusText}`,
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
            throw new TranslationError("Gemini API returned empty response");
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

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new TranslationError(
                `OpenAI API request failed: ${response.status} ${response.statusText}`,
            );
        }

        const payload = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const text = payload.choices?.[0]?.message?.content?.trim();

        if (!text) {
            throw new TranslationError("OpenAI API returned empty response");
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
