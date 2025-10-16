import { withSentry } from "@sentry/cloudflare";
// @ts-ignore - generated at build time by OpenNext
import appModule from "./.open-next/worker";

type FetchHandler<Env> = {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};

type MaybeFetchHandler<Env> =
    | FetchHandler<Env>
    | {
          fetch?: (
              request: Request,
              env: Env,
              ctx: ExecutionContext,
          ) => Response | Promise<Response>;
      }
    | ((request: Request, env: Env, ctx: ExecutionContext) => Response | Promise<Response>);

function toFetchHandler<Env>(handler: MaybeFetchHandler<Env>): FetchHandler<Env> {
    if (typeof handler === "function") {
        const fetcher = handler;
        return {
            async fetch(request, env, ctx) {
                const result = fetcher(request, env, ctx);
                return result instanceof Promise ? result : Promise.resolve(result);
            },
        } satisfies FetchHandler<Env>;
    }

    if (handler && typeof handler === "object" && "fetch" in handler) {
        const candidate = handler as {
            fetch?: (
                request: Request,
                env: Env,
                ctx: ExecutionContext,
            ) => Response | Promise<Response>;
        };
        return {
            async fetch(request, env, ctx) {
                if (typeof candidate.fetch !== "function") {
                    throw new Error("Handler missing fetch implementation");
                }
                const result = candidate.fetch(request, env, ctx);
                return result instanceof Promise ? result : Promise.resolve(result);
            },
        } satisfies FetchHandler<Env>;
    }

    throw new Error("OpenNext worker 必须导出 fetch 处理函数。");
}

const app = toFetchHandler(appModule as MaybeFetchHandler<CloudflareEnv>);

const wrapWithSentry = withSentry as unknown as (
    options: (env: CloudflareEnv) => {
        dsn?: string;
        enabled: boolean;
        environment: string;
        release?: string;
        tracesSampleRate: number;
        profilesSampleRate: number;
        tunnel?: string;
    },
    handler: {
        fetch?: (
            request: Request,
            env: CloudflareEnv,
            ctx: ExecutionContext,
        ) => Response | Promise<Response>;
    },
) => {
    fetch?: (
        request: Request,
        env: CloudflareEnv,
        ctx: ExecutionContext,
    ) => Response | Promise<Response>;
};

const sentryWrapped = wrapWithSentry(
    (env) => {
        const dsn = env.SENTRY_DSN ?? process.env.SENTRY_DSN;
        const environment =
            env.NEXTJS_ENV ?? process.env.NEXTJS_ENV ?? process.env.NODE_ENV ?? "development";
        const release =
            env.SENTRY_RELEASE ??
            process.env.SENTRY_RELEASE ??
            process.env.VERCEL_GIT_COMMIT_SHA;
        const tracesSampleRate = Number.parseFloat(
            env.SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0",
        );
        const profilesSampleRate = Number.parseFloat(
            env.SENTRY_PROFILES_SAMPLE_RATE ?? process.env.SENTRY_PROFILES_SAMPLE_RATE ?? "0",
        );
        const tunnel = env.SENTRY_TUNNEL ?? process.env.SENTRY_TUNNEL;

        const clampRate = (value: number) => {
            if (!Number.isFinite(value) || value <= 0) return 0;
            if (value > 1) return 1;
            return value;
        };

        return {
            dsn: dsn || undefined,
            enabled: Boolean(dsn),
            environment,
            release: release || undefined,
            tracesSampleRate: clampRate(tracesSampleRate),
            profilesSampleRate: clampRate(profilesSampleRate),
            tunnel: tunnel || undefined,
        };
    },
    {
        fetch(request, env, ctx) {
            return app.fetch(request, env, ctx);
        },
    },
);

const sentryHandler = toFetchHandler(
    (sentryWrapped ?? {}) as MaybeFetchHandler<CloudflareEnv>,
);

export async function fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
) {
    return sentryHandler.fetch(request, env, ctx);
}

export default sentryHandler;
