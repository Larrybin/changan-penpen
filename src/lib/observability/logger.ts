import type { TraceContext } from "@/lib/observability/trace";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerContext {
    traceId?: string;
    spanId?: string;
    requestId?: string;
    userId?: string;
    source?: string;
}

export interface Logger {
    child(context: Partial<LoggerContext>): Logger;
    debug(message: string, metadata?: Record<string, unknown>): void;
    info(message: string, metadata?: Record<string, unknown>): void;
    warn(message: string, metadata?: Record<string, unknown>): void;
    error(message: string, metadata?: Record<string, unknown>): void;
}

function writeLog(level: LogLevel, message: string, payload: Record<string, unknown>) {
    const entry = {
        level,
        message,
        time: new Date().toISOString(),
        ...payload,
    };
    const serialized = JSON.stringify(entry);
    if (level === "error") {
        console.error(serialized);
    } else if (level === "warn") {
        console.warn(serialized);
    } else if (level === "debug") {
        console.debug(serialized);
    } else {
        console.log(serialized);
    }
}

function buildPayload(context: LoggerContext, metadata?: Record<string, unknown>) {
    const base: Record<string, unknown> = { ...context };
    if (metadata) {
        Object.assign(base, metadata);
    }
    return base;
}

export function createLogger(context: LoggerContext = {}): Logger {
    const log = (level: LogLevel, message: string, metadata?: Record<string, unknown>) => {
        writeLog(level, message, buildPayload(context, metadata));
    };

    return {
        child(extra: Partial<LoggerContext>): Logger {
            return createLogger({ ...context, ...extra });
        },
        debug(message: string, metadata?: Record<string, unknown>) {
            log("debug", message, metadata);
        },
        info(message: string, metadata?: Record<string, unknown>) {
            log("info", message, metadata);
        },
        warn(message: string, metadata?: Record<string, unknown>) {
            log("warn", message, metadata);
        },
        error(message: string, metadata?: Record<string, unknown>) {
            log("error", message, metadata);
        },
    };
}

export function loggerFromTrace(trace: TraceContext, context: Partial<LoggerContext> = {}): Logger {
    return createLogger({
        traceId: trace.traceId,
        spanId: trace.spanId,
        requestId: trace.requestId,
        userId: trace.userId,
        ...context,
    });
}
