import type { SentryOptions } from "@sentry/nextjs";

type Runtime = "server" | "client" | "edge";

type NormalizedOptions = SentryOptions & {
  enabled: boolean;
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

const resolveEnvironment = (): string => {
  return (
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXTJS_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
};

const resolveRelease = (): string | undefined => {
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

export const buildSentryOptions = (runtime: Runtime): NormalizedOptions => {
  const dsn = resolveDsn(runtime);
  const enabled = Boolean(dsn) && process.env.SENTRY_ENABLED !== "0";

  const baseOptions: NormalizedOptions = {
    dsn,
    enabled,
    environment: resolveEnvironment(),
    release: resolveRelease(),
    debug: process.env.SENTRY_DEBUG === "1",
    sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === "1",
    autoSessionTracking: runtime === "client" && process.env.SENTRY_AUTO_SESSION_TRACKING !== "0",
    tracesSampleRate: parseSampleRate(
      runtime === "client"
        ? process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE
        : process.env.SENTRY_TRACES_SAMPLE_RATE,
      runtime === "client" ? 0.05 : 0.1,
    ),
    profilesSampleRate:
      runtime === "server" || runtime === "edge"
        ? parseSampleRate(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0)
        : undefined,
  };

  return baseOptions;
};

export const buildClientReplayRates = () => {
  return {
    replaysSessionSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      0,
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      0.1,
    ),
  };
};

export const resolveTunnelRoute = () => {
  return process.env.SENTRY_TUNNEL_ROUTE || process.env.NEXT_PUBLIC_SENTRY_TUNNEL_ROUTE;
};
