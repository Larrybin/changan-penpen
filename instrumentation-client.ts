import * as Sentry from "@sentry/nextjs";
type SentryInitOptions = Parameters<typeof Sentry.init>[0];
type IntegrationsUnion = NonNullable<SentryInitOptions["integrations"]>;
type IntegrationArray = Extract<IntegrationsUnion, unknown[]>;
type IntegrationType = IntegrationArray extends (infer T)[] ? T : never;

import {
    DEFAULT_SENTRY_DSN,
    buildClientReplayRates,
    buildSentryOptions,
    resolveEnvironment,
    resolveRelease,
} from "./sentry.config";

const options = buildSentryOptions("client");
const { replaysSessionSampleRate, replaysOnErrorSampleRate } = buildClientReplayRates();

type MaybeTracing = { browserTracingIntegration?: () => unknown };
const maybeTracing = (Sentry as unknown as MaybeTracing).browserTracingIntegration;
const rawIntegrations: Array<IntegrationType | undefined> = [
    typeof maybeTracing === "function" ? (maybeTracing() as IntegrationType) : undefined,
    replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0
        ? Sentry.replayIntegration()
        : undefined,
    Sentry.feedbackIntegration({ colorScheme: "system" }),
];

const integrations: IntegrationType[] = rawIntegrations.filter(
    (integration): integration is IntegrationType => Boolean(integration),
);

const optRec = options as Record<string, unknown>;
const normalizedTracesSampleRate =
    typeof optRec.tracesSampleRate === "number"
        ? (optRec.tracesSampleRate as number)
        : 1.0;
Sentry.init({
    ...options,
    dsn:
        (typeof optRec.dsn === "string" ? (optRec.dsn as string) : undefined) ??
        process.env.NEXT_PUBLIC_SENTRY_DSN ??
            process.env.SENTRY_DSN ??
            DEFAULT_SENTRY_DSN,
    sendDefaultPii: true,
    release:
        (typeof optRec.release === "string"
            ? (optRec.release as string)
            : undefined) ?? resolveRelease(),
    environment:
        (typeof optRec.environment === "string"
            ? (optRec.environment as string)
            : undefined) ?? resolveEnvironment(),
    tracesSampleRate: normalizedTracesSampleRate,
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
    integrations,
    // Allow browser to propagate trace headers to API/worker endpoints
    tracePropagationTargets: [
        /^\/api\//,
        /localhost/,
        /127\.0\.0\.1/,
        /\.workers\.dev/,
        /\.pages\.dev/,
    ],
});

// Optional: Next.js may call this symbol to mark route transitions.
// Using a no-op avoids importing SDK internals that may not exist in every version.
export const onRouterTransitionStart = () => undefined;
