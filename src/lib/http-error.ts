export interface ApiErrorDetails {
    [key: string]: unknown;
}

export interface ApiErrorResponse<Details = ApiErrorDetails> {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Details;
    };
    status: number;
    timestamp: string;
    traceId: string;
}

export interface CreateApiErrorResponseOptions<Details = ApiErrorDetails> {
    status?: number;
    code: string;
    message: string;
    details?: Details;
    headers?: HeadersInit;
    traceId?: string;
    timestamp?: string;
    requestId?: string;
}

function generateTraceId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function mergeHeaders(target: Headers, extra?: HeadersInit) {
    if (!extra) return;
    const incoming = new Headers(extra);
    incoming.forEach((value, key) => {
        target.set(key, value);
    });
}

export function createApiErrorPayload<Details = ApiErrorDetails>(
    options: CreateApiErrorResponseOptions<Details>,
): ApiErrorResponse<Details> {
    const status = options.status ?? 500;
    const traceId = options.traceId ?? generateTraceId();
    const timestamp = options.timestamp ?? new Date().toISOString();

    const payload: ApiErrorResponse<Details> = {
        success: false,
        error: {
            code: options.code,
            message: options.message,
            ...(options.details !== undefined
                ? { details: options.details }
                : {}),
        },
        status,
        timestamp,
        traceId,
    };

    return payload;
}

export function createApiErrorResponse<Details = ApiErrorDetails>(
    options: CreateApiErrorResponseOptions<Details>,
): Response {
    const payload = createApiErrorPayload(options);
    const headers = new Headers({
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
    });

    mergeHeaders(headers, options.headers);
    headers.set("X-Trace-Id", payload.traceId);

    const requestId = options.requestId;
    if (requestId && !headers.has("X-Request-Id")) {
        headers.set("X-Request-Id", requestId);
    }

    return new Response(JSON.stringify(payload), {
        status: payload.status,
        headers,
    });
}

export interface ApiErrorInit<Details = ApiErrorDetails>
    extends Omit<CreateApiErrorResponseOptions<Details>, "message"> {
    message?: string;
}

export class ApiError<Details = ApiErrorDetails> extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details?: Details;
    public readonly traceId?: string;

    constructor(message: string, init: ApiErrorInit<Details>) {
        super(init.message ?? message);
        this.name = "ApiError";
        this.status = init.status ?? 500;
        this.code = init.code;
        this.details = init.details;
        this.traceId = init.traceId;
    }

    toResponse(options?: {
        headers?: HeadersInit;
        timestamp?: string;
    }): Response {
        return createApiErrorResponse({
            status: this.status,
            code: this.code,
            message: this.message,
            details: this.details,
            traceId: this.traceId,
            headers: options?.headers,
            timestamp: options?.timestamp,
        });
    }
}

export function isApiError(candidate: unknown): candidate is ApiError<unknown> {
    return candidate instanceof ApiError;
}
