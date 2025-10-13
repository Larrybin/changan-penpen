// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions, DEFAULT_SENTRY_DSN } from "./sentry.config";

const options = buildSentryOptions("server");
const { enableTracing: _enableTracing, enableLogs: _enableLogs, ...restOptions } = options;
const normalized = restOptions as Parameters<typeof Sentry.init>[0] & {
    dsn?: string;
    tracesSampleRate?: number;
};

Sentry.init({
    ...normalized,
    dsn:
        (typeof normalized.dsn === "string" ? normalized.dsn : undefined) ??
        process.env.SENTRY_DSN ??
        DEFAULT_SENTRY_DSN,
    tracesSampleRate:
        typeof normalized.tracesSampleRate === "number"
            ? normalized.tracesSampleRate
            : 1.0,
    // Keep integrations minimal for broad SDK compatibility
    integrations: normalized.integrations ?? [],
});
