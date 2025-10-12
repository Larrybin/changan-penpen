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
});

export const onRouterTransitionStart =
    // Not all SDK versions expose this helper; fallback to no-op
    (Sentry as any).captureRouterTransitionStart ?? (() => undefined);
