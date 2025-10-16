import { withSentry } from "@sentry/cloudflare";
// @ts-ignore - generated at build time by OpenNext
import appModule from "./.open-next/worker";

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

const app = toFetchHandler(appModule as MaybeFetchHandler<CloudflareEnv>);

function parseRate(value: string | undefined): number {
    const parsed = Number.parseFloat(value ?? "0");
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return parsed > 1 ? 1 : parsed;
}

const sentryHandler = withSentry<FetchHandler<CloudflareEnv>>(
    (env) => {
        const dsn = env.SENTRY_DSN ?? process.env.SENTRY_DSN;
        const environment =
            env.NEXTJS_ENV ?? process.env.NEXTJS_ENV ?? process.env.NODE_ENV ?? "development";
        const release =
            env.SENTRY_RELEASE ??
            process.env.SENTRY_RELEASE ??
            process.env.VERCEL_GIT_COMMIT_SHA;
        const tracesSampleRate = parseRate(
            env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE,
        );
        const profilesSampleRate = parseRate(
            env.SENTRY_PROFILES_SAMPLE_RATE ?? process.env.SENTRY_PROFILES_SAMPLE_RATE,
        );
        const tunnel = env.SENTRY_TUNNEL ?? process.env.SENTRY_TUNNEL;

        return {
            dsn: dsn || undefined,
            enabled: Boolean(dsn),
            environment,
            release,
            tracesSampleRate,
            profilesSampleRate,
            tunnel: tunnel || undefined,
        };
    },
    {
        async fetch(request, env, ctx) {
            return app.fetch(request, env, ctx);
        },
    },
);

export async function fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
) {
    return sentryHandler.fetch(request, env, ctx);
}

export default sentryHandler;
