import { ApiError } from "@/lib/http-error";

export interface ApiClientConfig {
    baseUrl?: string;
    credentials?: RequestCredentials;
    defaultHeaders?: HeadersInit;
    fetchImplementation?: typeof fetch;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
    body?: BodyInit | null;
    searchParams?:
        | URLSearchParams
        | Record<string, string | number | boolean | null | undefined>;
    json?: unknown;
}

export interface ApiResponse<TData> {
    data: TData;
    status: number;
    headers: Headers;
    response: Response;
}

export interface ApiErrorFieldDetail {
    field?: string | null;
    message: string;
}

export interface ApiRateLimitMeta {
    limit?: number;
    remaining?: number;
    reset?: number;
}

export interface ApiErrorDetails {
    body?: unknown;
    headers?: Record<string, string>;
    statusText?: string;
    errors?: ApiErrorFieldDetail[];
    fieldErrors?: Record<string, string>;
    retryAfterSeconds?: number;
    rateLimit?: ApiRateLimitMeta;
}

interface ErrorExtractionResult {
    code: string;
    message: string;
    errors?: ApiErrorFieldDetail[];
    fieldErrors?: Record<string, string>;
    body?: unknown;
}

interface BuildErrorOptions {
    response: Response;
    parsedBody: unknown;
    rawBody: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function applyHeaders(target: Headers, init?: HeadersInit) {
    if (!init) {
        return;
    }

    const headers = new Headers(init);
    headers.forEach((value, key) => {
        target.set(key, value);
    });
}

function joinBaseAndPath(baseUrl: string | undefined, path: string) {
    if (!baseUrl || /^https?:/i.test(path)) {
        return path;
    }

    const normalizedBase = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    if (!normalizedPath) {
        return normalizedBase;
    }
    return `${normalizedBase}/${normalizedPath}`;
}

function appendSearchParams(
    input: string,
    params?:
        | URLSearchParams
        | Record<string, string | number | boolean | null | undefined>,
) {
    if (!params) {
        return input;
    }

    const isAbsolute = /^https?:/i.test(input);
    const url = new URL(input, isAbsolute ? undefined : "http://localhost");
    const target = url.searchParams;

    const appendPair = (key: string, value: string) => {
        if (value.length === 0) {
            return;
        }
        target.append(key, value);
    };

    if (params instanceof URLSearchParams) {
        params.forEach((value, key) => {
            appendPair(key, value);
        });
    } else {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return;
            }
            appendPair(key, String(value));
        });
    }

    const search = target.toString();
    const prefix = isAbsolute ? `${url.origin}` : "";
    return `${prefix}${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
}

function parseRetryAfter(value: string | null) {
    if (!value) {
        return undefined;
    }

    const seconds = Number.parseInt(value, 10);
    if (Number.isFinite(seconds)) {
        return seconds;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        const diff = Math.ceil((date.getTime() - Date.now()) / 1000);
        return diff > 0 ? diff : undefined;
    }

    return undefined;
}

function toNumber(value: string | null) {
    if (value === null || value === undefined || value === "") {
        return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeErrors(errors: unknown): ApiErrorFieldDetail[] | undefined {
    if (!Array.isArray(errors)) {
        return undefined;
    }

    const normalized: ApiErrorFieldDetail[] = [];

    for (const entry of errors) {
        if (!entry || typeof entry !== "object") {
            continue;
        }
        const record = entry as Record<string, unknown>;
        const message = record.message;
        if (typeof message !== "string" || message.length === 0) {
            continue;
        }
        const field = record.field;
        normalized.push({
            field: typeof field === "string" ? field : null,
            message,
        });
    }

    return normalized.length > 0 ? normalized : undefined;
}

function extractFieldErrors(
    source: unknown,
): Record<string, string> | undefined {
    if (!source || typeof source !== "object") {
        return undefined;
    }

    const record = source as Record<string, unknown>;
    const aggregate: Record<string, string> = {};

    if (Array.isArray(record.errors)) {
        for (const entry of record.errors) {
            if (!entry || typeof entry !== "object") {
                continue;
            }
            const node = entry as Record<string, unknown>;
            const field = node.field;
            const message = node.message;
            if (typeof field === "string" && typeof message === "string") {
                aggregate[field] = message;
            }
        }
    }

    if (isRecord(record.details)) {
        const details = record.details;
        if (isRecord(details.fieldErrors)) {
            Object.entries(details.fieldErrors).forEach(([key, value]) => {
                if (typeof value === "string") {
                    aggregate[key] = value;
                }
            });
        }
        const field = details.field;
        const message = record.message ?? details.message;
        if (
            typeof field === "string" &&
            typeof message === "string" &&
            !(field in aggregate)
        ) {
            aggregate[field] = message;
        }
        if (Array.isArray(details.issues)) {
            for (const issue of details.issues) {
                if (!issue || typeof issue !== "object") {
                    continue;
                }
                const issueRecord = issue as Record<string, unknown>;
                const path = issueRecord.path;
                const issueMessage = issueRecord.message;
                if (
                    Array.isArray(path) &&
                    path.length > 0 &&
                    typeof issueMessage === "string"
                ) {
                    const key = path.join(".");
                    if (!(key in aggregate)) {
                        aggregate[key] = issueMessage;
                    }
                }
            }
        }
    }

    return Object.keys(aggregate).length > 0 ? aggregate : undefined;
}

function extractError(payload: unknown): ErrorExtractionResult {
    const fallback: ErrorExtractionResult = {
        code: "UNKNOWN_ERROR",
        message: "Request failed",
        body: payload,
    };

    if (!isRecord(payload)) {
        if (typeof payload === "string" && payload.length > 0) {
            return {
                code: "UNKNOWN_ERROR",
                message: payload,
                body: payload,
            };
        }
        return fallback;
    }

    const directCode = payload.code;
    const directMessage = payload.message;

    const errorNode = isRecord(payload.error) ? payload.error : undefined;
    const successFlag = payload.success;

    const code =
        (typeof directCode === "string" && directCode.length > 0
            ? directCode
            : undefined) ??
        (errorNode && typeof errorNode.code === "string"
            ? errorNode.code
            : undefined) ??
        (typeof successFlag === "boolean" && !successFlag
            ? "REQUEST_FAILED"
            : undefined) ??
        "UNKNOWN_ERROR";

    const message =
        (typeof directMessage === "string" && directMessage.length > 0
            ? directMessage
            : undefined) ??
        (errorNode && typeof errorNode.message === "string"
            ? errorNode.message
            : undefined) ??
        "Request failed";

    const errors =
        normalizeErrors(payload.errors) ??
        (errorNode ? normalizeErrors(errorNode.errors) : undefined);

    const fieldErrors =
        extractFieldErrors(payload) ??
        (errorNode ? extractFieldErrors(errorNode) : undefined);

    return {
        code,
        message,
        errors,
        fieldErrors,
        body: payload,
    };
}

function headersToObject(headers: Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
        record[key.toLowerCase()] = value;
    });
    return record;
}

function formatHeaderKey(key: string) {
    return key
        .split("-")
        .map((segment) => {
            if (!segment) {
                return segment;
            }
            return segment[0].toUpperCase() + segment.slice(1).toLowerCase();
        })
        .join("-");
}

function headersToRequestRecord(headers: Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
        record[formatHeaderKey(key)] = value;
    });
    return record;
}

function buildApiError({ response, parsedBody, rawBody }: BuildErrorOptions) {
    const extracted = extractError(parsedBody ?? rawBody ?? null);
    const retryAfterSeconds = parseRetryAfter(
        response.headers.get("Retry-After"),
    );
    const rateLimit: ApiRateLimitMeta | undefined = (() => {
        const limit = toNumber(response.headers.get("X-RateLimit-Limit"));
        const remaining = toNumber(
            response.headers.get("X-RateLimit-Remaining"),
        );
        const reset = toNumber(response.headers.get("X-RateLimit-Reset"));
        if (
            limit === undefined &&
            remaining === undefined &&
            reset === undefined
        ) {
            return undefined;
        }
        return { limit, remaining, reset };
    })();

    const details: ApiErrorDetails = {
        body: extracted.body,
        headers: headersToObject(response.headers),
        statusText: response.statusText,
        errors: extracted.errors,
        fieldErrors: extracted.fieldErrors,
        retryAfterSeconds,
        ...(rateLimit ? { rateLimit } : {}),
    };

    throw new ApiError(extracted.message, {
        status: response.status,
        code:
            extracted.code ||
            `HTTP_${Number.isFinite(response.status) ? response.status : "ERROR"}`,
        details,
    });
}

export function createApiClient(config: ApiClientConfig = {}) {
    const baseHeaders = new Headers();
    applyHeaders(baseHeaders, config.defaultHeaders);

    async function request<TData = unknown>(
        path: string,
        options: ApiRequestOptions = {},
    ): Promise<ApiResponse<TData>> {
        const {
            searchParams,
            json,
            headers: optionHeaders,
            body: optionBody,
            credentials: optionCredentials,
            method: optionMethod,
            ...rest
        } = options;

        const headers = new Headers(baseHeaders);
        applyHeaders(headers, optionHeaders);

        const method = (optionMethod ?? "GET").toString().toUpperCase();

        let body: BodyInit | undefined;
        if (json !== undefined) {
            body = JSON.stringify(json);
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
        } else if (optionBody !== undefined && optionBody !== null) {
            body = optionBody;
        }

        const credentials = optionCredentials ?? config.credentials;
        const requestInit: RequestInit = {
            ...rest,
            method,
        };
        if (body !== undefined) {
            requestInit.body = body;
        }
        const headersRecord = headersToRequestRecord(headers);
        if (Object.keys(headersRecord).length > 0) {
            requestInit.headers = headersRecord;
        }
        if (credentials) {
            requestInit.credentials = credentials;
        }

        const urlWithBase = joinBaseAndPath(config.baseUrl, path);
        const url = appendSearchParams(urlWithBase, searchParams);

        const runtimeFetch = config.fetchImplementation ?? globalThis.fetch;
        if (typeof runtimeFetch !== "function") {
            throw new Error(
                "Fetch API is not available in the current environment",
            );
        }

        const response = await runtimeFetch(url, requestInit);
        const rawBody = await response.text();
        const parsedBody = (() => {
            if (!rawBody) {
                return null;
            }
            try {
                return JSON.parse(rawBody) as unknown;
            } catch {
                return rawBody;
            }
        })();

        if (!response.ok) {
            buildApiError({ response, parsedBody, rawBody });
        }

        return {
            data: parsedBody as TData,
            status: response.status,
            headers: response.headers,
            response,
        };
    }

    return {
        request,
        get<TData = unknown>(
            path: string,
            options?: Omit<ApiRequestOptions, "method" | "json" | "body">,
        ) {
            return request<TData>(path, { ...options, method: "GET" });
        },
        post<TData = unknown>(path: string, options?: ApiRequestOptions) {
            return request<TData>(path, { ...options, method: "POST" });
        },
        put<TData = unknown>(path: string, options?: ApiRequestOptions) {
            return request<TData>(path, { ...options, method: "PUT" });
        },
        patch<TData = unknown>(path: string, options?: ApiRequestOptions) {
            return request<TData>(path, { ...options, method: "PATCH" });
        },
        delete<TData = unknown>(path: string, options?: ApiRequestOptions) {
            return request<TData>(path, { ...options, method: "DELETE" });
        },
    };
}

export type ApiClient = ReturnType<typeof createApiClient>;
