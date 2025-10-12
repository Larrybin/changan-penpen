import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions } from "./sentry.config";

const options = buildSentryOptions("server");

Sentry.init({
    ...options,
    sendDefaultPii: true,
    enableLogs: options.enableLogs ?? true,
});
