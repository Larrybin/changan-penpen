import * as Sentry from "@sentry/nextjs";

import { buildClientReplayRates, buildSentryOptions, resolveTunnelRoute } from "./sentry.config";

const options = buildSentryOptions("client");
const { replaysSessionSampleRate, replaysOnErrorSampleRate } = buildClientReplayRates();
const tunnelRoute = resolveTunnelRoute();

Sentry.init({
  ...options,
  replaysSessionSampleRate,
  replaysOnErrorSampleRate,
  tunnel: tunnelRoute,
});
