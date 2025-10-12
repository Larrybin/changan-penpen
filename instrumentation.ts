export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config");
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        await import("./sentry.edge.config");
    }

    if (!process.env.NEXT_RUNTIME) {
        await import("./sentry.server.config");
    }
}

type CaptureRequestErrorArgs = Parameters<
    typeof import("@sentry/nextjs").captureRequestError
>;

export const onRequestError = (...args: CaptureRequestErrorArgs) => {
    const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
    Sentry.captureRequestError(...args);
};
