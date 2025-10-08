import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions } from "./sentry.config";

const options = buildSentryOptions("edge");

Sentry.init({
  ...options,
});
