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

const handler = toFetchHandler(appModule as MaybeFetchHandler<CloudflareEnv>);

export async function fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    return handler.fetch(request, env, ctx);
}

export default handler;
