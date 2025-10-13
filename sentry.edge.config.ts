// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions, DEFAULT_SENTRY_DSN } from "./sentry.config";

const options = buildSentryOptions("edge");
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
    // Keep integrations minimal for compatibility across SDK versions
    integrations: normalized.integrations ?? [],
});
