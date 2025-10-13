// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

type SentryInitOptions = Parameters<typeof Sentry.init>[0];
type IntegrationsUnion = NonNullable<SentryInitOptions["integrations"]>;
type IntegrationArray = Extract<IntegrationsUnion, unknown[]>;
type IntegrationType = IntegrationArray extends (infer T)[] ? T : never;

type MaybeTracing = { browserTracingIntegration?: () => unknown };
const maybeTracing = (Sentry as unknown as MaybeTracing)
    .browserTracingIntegration;

const rawIntegrations: Array<IntegrationType | undefined> = [
    typeof maybeTracing === "function"
        ? (maybeTracing() as IntegrationType)
        : undefined,
    Sentry.replayIntegration(),
];

const integrations: IntegrationType[] = rawIntegrations.filter(
    (integration): integration is IntegrationType => Boolean(integration),
);

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Add optional integrations for additional features
    integrations,
    // Define how likely traces are sampled. Adjust this value in production
    tracesSampleRate: 1,
    // Ensure trace headers propagate to your API/worker endpoints
    tracePropagationTargets: [
        /^\/api\//,
        /localhost/,
        /127\.0\.0\.1/,
        /\.workers\.dev/,
        /\.pages\.dev/,
    ],
    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});

export const onRouterTransitionStart = () => undefined;
