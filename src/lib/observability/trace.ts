import { createRandomId } from "@/lib/random";

export interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    requestId?: string;
    userId?: string;
}

const TRACE_HEADER = "X-Trace-Id";
const SPAN_HEADER = "X-Span-Id";
const REQUEST_HEADER = "X-Request-Id";
const USER_HEADER = "X-User-Id";

function safeRandomId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return createRandomId();
}

export function createTraceId(): string {
    return safeRandomId();
}

export function createSpanId(): string {
    return safeRandomId();
}

export function createTraceContext(init: Partial<TraceContext> = {}): TraceContext {
    return {
        traceId: init.traceId ?? createTraceId(),
        spanId: init.spanId ?? createSpanId(),
        parentSpanId: init.parentSpanId,
        requestId: init.requestId,
        userId: init.userId,
    };
}

export function parseTraceContextFromHeaders(headers: Headers | Record<string, string | null | undefined>):
    Partial<TraceContext> {
    const getHeader = (name: string): string | undefined => {
        if (headers instanceof Headers) {
            return headers.get(name) ?? undefined;
        }
        const value = headers[name];
        return value === null || value === undefined ? undefined : value;
    };

    return {
        traceId: getHeader(TRACE_HEADER),
        spanId: getHeader(SPAN_HEADER),
        requestId: getHeader(REQUEST_HEADER),
        userId: getHeader(USER_HEADER),
    };
}

export function applyTraceContextHeaders(headers: Headers, context: TraceContext): void {
    headers.set(TRACE_HEADER, context.traceId);
    headers.set(SPAN_HEADER, context.spanId);
    if (context.requestId) {
        headers.set(REQUEST_HEADER, context.requestId);
    }
    if (context.userId) {
        headers.set(USER_HEADER, context.userId);
    }
}

export function mergeTraceContext(
    base: TraceContext,
    overrides: Partial<TraceContext>,
): TraceContext {
    return {
        traceId: overrides.traceId ?? base.traceId,
        spanId: overrides.spanId ?? base.spanId,
        parentSpanId: overrides.parentSpanId ?? base.parentSpanId,
        requestId: overrides.requestId ?? base.requestId,
        userId: overrides.userId ?? base.userId,
    };
}
