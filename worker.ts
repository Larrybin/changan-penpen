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

export async function fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
) {
    return app.fetch(request, env, ctx);
}

export default { fetch } as FetchHandler<CloudflareEnv>;
