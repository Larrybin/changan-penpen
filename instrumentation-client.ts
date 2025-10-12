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
    dsn: options.dsn ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    enableLogs: options.enableLogs ?? true,
    release: options.release ?? resolveRelease(),
    environment: options.environment ?? resolveEnvironment(),
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
    integrations,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
