import * as Sentry from "@sentry/cloudflare";

import appModule from "./.open-next/worker";

type VersionMetadata = {
    id?: string;
};

type WorkerEnv = CloudflareEnv & {
    SENTRY_DSN?: string;
    SENTRY_ENVIRONMENT?: string;
    SENTRY_RELEASE?: string;
    SENTRY_ENABLE_LOGS?: string;
    CF_VERSION_METADATA?: VersionMetadata;
};

type FetchHandler<Env> = {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};

type MaybeFetchHandler<Env> =
    | FetchHandler<Env>
    | ((request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>);

function toFetchHandler<Env>(handler: MaybeFetchHandler<Env>): FetchHandler<Env> {
    if (typeof handler === "function") {
        return {
            fetch: handler,
        };
    }

    if (handler && typeof handler === "object" && "fetch" in handler) {
        const candidate = handler as FetchHandler<Env>;
        return {
            fetch: candidate.fetch.bind(handler),
        };
    }

    throw new Error("OpenNext worker 必须导出 fetch 处理函数。");
}

const app = toFetchHandler(appModule as MaybeFetchHandler<WorkerEnv>);

const debugWrapper: FetchHandler<WorkerEnv> = {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname === "/debug-sentry") {
            throw new Error("My first Sentry error!");
        }

        return app.fetch(request, env, ctx);
    },
};

export default Sentry.withSentry<WorkerEnv>(
    (env) => ({
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT ?? env.NEXTJS_ENV ?? "development",
        release: env.SENTRY_RELEASE ?? env.CF_VERSION_METADATA?.id,
        sendDefaultPii: true,
        enableLogs: env.SENTRY_ENABLE_LOGS !== "0",
        tracesSampleRate: 1.0,
    }),
    debugWrapper,
);
