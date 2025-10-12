import type { SentryOptions } from "@sentry/nextjs";

type Runtime = "server" | "client" | "edge";

type NormalizedOptions = SentryOptions & {
    enabled: boolean;
    enableTracing?: boolean;
    enableLogs?: boolean;
};

const parseSampleRate = (value: string | undefined, fallback: number): number => {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
    }

    return fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
    if (value === undefined) {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === "0" || normalized === "false" || normalized === "no") {
        return false;
    }

    if (normalized === "1" || normalized === "true" || normalized === "yes") {
        return true;
    }

    return fallback;
};

export const resolveEnvironment = (): string => {
    return (
        process.env.SENTRY_ENVIRONMENT ||
        process.env.NEXTJS_ENV ||
        process.env.NODE_ENV ||
        "development"
    );
};

export const resolveRelease = (): string | undefined => {
    return (
        process.env.SENTRY_RELEASE ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        process.env.CF_PAGES_COMMIT_SHA ||
        process.env.NEXT_PUBLIC_COMMIT_SHA
    );
};

const resolveDsn = (runtime: Runtime): string | undefined => {
    if (runtime === "client") {
        return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
    }

    return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
};

const resolveDefaultTraceRate = (runtime: Runtime): number => {
    const environment = resolveEnvironment();
    const isProduction = environment === "production" || process.env.NODE_ENV === "production";

    if (runtime === "client") {
        return isProduction ? 0.1 : 1.0;
    }

    return isProduction ? 0.1 : 1.0;
};

export const buildSentryOptions = (runtime: Runtime): NormalizedOptions => {
    const dsn = resolveDsn(runtime);
    const enabled = Boolean(dsn) && parseBoolean(process.env.SENTRY_ENABLED, true);

    const tracesRate = parseSampleRate(
        runtime === "client"
            ? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE
            : process.env.SENTRY_TRACES_SAMPLE_RATE,
        resolveDefaultTraceRate(runtime),
    );

    return {
        dsn,
        enabled,
        environment: resolveEnvironment(),
        release: resolveRelease(),
        debug: parseBoolean(process.env.SENTRY_DEBUG, false),
        sendDefaultPii: parseBoolean(process.env.SENTRY_SEND_DEFAULT_PII, true),
        enableTracing: tracesRate > 0,
        enableLogs: parseBoolean(process.env.SENTRY_ENABLE_LOGS, true),
        tracesSampleRate: tracesRate,
        profilesSampleRate:
            runtime === "server" || runtime === "edge"
                ? parseSampleRate(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0)
                : undefined,
        autoSessionTracking: runtime === "client" && parseBoolean(process.env.SENTRY_AUTO_SESSION_TRACKING, true),
        tunnel: resolveTunnelRoute(),
    };
};

export const buildClientReplayRates = () => {
    return {
        replaysSessionSampleRate: parseSampleRate(
            process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ||
                process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
            0.1,
        ),
        replaysOnErrorSampleRate: parseSampleRate(
            process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ||
                process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
            1.0,
        ),
    };
};

export const resolveTunnelRoute = () => {
    return process.env.SENTRY_TUNNEL_ROUTE || process.env.NEXT_PUBLIC_SENTRY_TUNNEL_ROUTE;
};
