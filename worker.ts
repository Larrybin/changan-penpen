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

const MARKETING_CACHE_HEADER = "X-Marketing-Cache";
const MARKETING_VARIANT_COOKIE_PREFIX = "marketing-variant-";

function isLocaleSegment(value: string): boolean {
    return /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value);
}

function shouldHandleMarketingCache(request: Request): boolean {
    if (request.method !== "GET") {
        return false;
    }

    const accept = request.headers.get("accept");
    if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
        return false;
    }

    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
        return false;
    }
    if (segments.length === 1) {
        const [segment] = segments;
        if (!segment || !isLocaleSegment(segment)) {
            return false;
        }
    }

    if (url.searchParams.has("previewToken")) {
        return false;
    }
    for (const key of url.searchParams.keys()) {
        if (key.startsWith("variant_")) {
            return false;
        }
    }

    const cookieHeader = request.headers.get("cookie");
    if (
        cookieHeader &&
        cookieHeader.toLowerCase().includes(MARKETING_VARIANT_COOKIE_PREFIX)
    ) {
        return false;
    }

    return true;
}

export async function fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
) {
    const shouldUseCache = shouldHandleMarketingCache(request);
    const cacheKey = shouldUseCache ? new Request(request.url, request) : null;
    if (shouldUseCache && cacheKey) {
        const cached = await caches.default.match(cacheKey);
        if (cached) {
            return cached;
        }
    }

    const response = await handler.fetch(request, env, ctx);
    const cacheHint = response.headers.get(MARKETING_CACHE_HEADER);
    if (!cacheHint) {
        return response;
    }

    const headers = new Headers(response.headers);
    headers.delete(MARKETING_CACHE_HEADER);
    const finalResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });

    const waitUntil =
        typeof ctx?.waitUntil === "function"
            ? ctx.waitUntil.bind(ctx)
            : undefined;
    if (
        shouldUseCache &&
        cacheHint === "default" &&
        cacheKey &&
        response.ok
    ) {
        const putPromise = caches.default.put(cacheKey, finalResponse.clone());
        if (waitUntil) {
            waitUntil(putPromise);
        } else {
            await putPromise;
        }
    }

    return finalResponse;
}

export default handler;
