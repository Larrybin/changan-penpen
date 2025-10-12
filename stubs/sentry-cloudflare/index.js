const toFetchHandler = (handler) => {
    if (typeof handler === "function") {
        return {
            fetch: handler,
        };
    }

    if (handler && typeof handler === "object" && typeof handler.fetch === "function") {
        return handler;
    }

    throw new Error("[@sentry/cloudflare] withSentry expects a fetch handler");
};

export const withSentry = (configOrFactory, handler) => {
    const fetchHandler = toFetchHandler(handler);

    return {
        async fetch(request, env, ctx) {
            const config =
                typeof configOrFactory === "function"
                    ? await configOrFactory(env, request, ctx)
                    : configOrFactory;

            const enableLogs = Boolean(config?.enableLogs);
            if (enableLogs) {
                console.debug(
                    "[@sentry/cloudflare] handling request",
                    request.method,
                    request.url,
                );
            }

            try {
                return await fetchHandler.fetch(request, env, ctx);
            } catch (error) {
                if (enableLogs) {
                    console.error("[@sentry/cloudflare] captured error", error);
                }

                throw error;
            }
        },
    };
};

export const init = () => {
    // noop stub
};

export default {
    withSentry,
    init,
};
