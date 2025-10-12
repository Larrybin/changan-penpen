import * as Sentry from "@sentry/nextjs";

import {
    buildClientReplayRates,
    buildSentryOptions,
    resolveEnvironment,
    resolveRelease,
} from "./sentry.config";

const options = buildSentryOptions("client");
const { replaysSessionSampleRate, replaysOnErrorSampleRate } = buildClientReplayRates();

const rawIntegrations = [
    // Optional performance instrumentation if available in current SDK
    (Sentry as any).browserTracingIntegration
        ? (Sentry as any).browserTracingIntegration()
        : undefined,
    replaysSessionSampleRate > 0 || replaysOnErrorSampleRate > 0
        ? Sentry.replayIntegration()
        : undefined,
    Sentry.feedbackIntegration({ colorScheme: "system" }),
];

const integrations = rawIntegrations.filter(
    (integration): integration is NonNullable<(typeof rawIntegrations)[number]> => Boolean(integration),
);

Sentry.init({
    ...options,
    dsn: (options as any).dsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    release: (options as any).release ?? resolveRelease(),
    environment: (options as any).environment ?? resolveEnvironment(),
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
