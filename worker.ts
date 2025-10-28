// @ts-ignore - generated at build time by OpenNext
import appModule from "./.open-next/worker";
import {
    configureMetricsReporter,
    flushMetrics,
    isMetricsReporterConfigured,
} from "./src/lib/observability/metrics";

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

let lastMetricsConfigKey: string | null = null;

function parsePositiveInteger(value: string | undefined): number | undefined {
    if (!value) {
        return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }
    return parsed;
}

function ensureMetricsReporter(env: CloudflareEnv): void {
    const endpoint =
        env.OBSERVABILITY_METRICS_ENDPOINT ??
        process.env.OBSERVABILITY_METRICS_ENDPOINT;
    if (!endpoint) {
        return;
    }

    const token =
        env.OBSERVABILITY_METRICS_TOKEN ??
        process.env.OBSERVABILITY_METRICS_TOKEN;
    const flushInterval = parsePositiveInteger(
        env.OBSERVABILITY_METRICS_FLUSH_INTERVAL_MS ??
            process.env.OBSERVABILITY_METRICS_FLUSH_INTERVAL_MS,
    );
    const maxBufferSize = parsePositiveInteger(
        env.OBSERVABILITY_METRICS_MAX_BUFFER ??
            process.env.OBSERVABILITY_METRICS_MAX_BUFFER,
    );

    const configKey = [
        endpoint,
        token ?? "",
        flushInterval?.toString() ?? "",
        maxBufferSize?.toString() ?? "",
    ].join("::");

    if (configKey === lastMetricsConfigKey && isMetricsReporterConfigured()) {
        return;
    }

    configureMetricsReporter({
        endpoint,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        flushIntervalMs: flushInterval,
        maxBufferSize,
    });
    lastMetricsConfigKey = configKey;
}

const MARKETING_CACHE_HEADER = "X-Marketing-Cache";
const MARKETING_VARIANT_COOKIE_PREFIX = "marketing-variant-";

type LinkHint = {
    href: string;
    rel: string;
    as?: string;
    crossOrigin?: string;
};

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

function collectLinkHints(env: CloudflareEnv): LinkHint[] {
    const hints: LinkHint[] = [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossOrigin: "anonymous",
        },
    ];

    const r2Url = env.CLOUDFLARE_R2_URL ?? process.env.CLOUDFLARE_R2_URL;
    if (typeof r2Url === "string") {
        try {
            const origin = new URL(r2Url).origin;
            hints.push({ rel: "preconnect", href: origin, crossOrigin: "anonymous" });
        } catch {
            // ignore invalid URL
        }
    }

    return hints;
}

function appendLinkHeaders(headers: Headers, hints: LinkHint[]) {
    if (!hints.length) {
        return;
    }
    const serialized = hints
        .map((hint) => {
            const parts = [`<${hint.href}>`, `rel="${hint.rel}"`];
            if (hint.as) {
                parts.push(`as="${hint.as}"`);
            }
            if (hint.crossOrigin) {
                parts.push(`crossorigin="${hint.crossOrigin}"`);
            }
            return parts.join("; ");
        })
        .join(", ");
    if (!serialized) {
        return;
    }

    const existing = headers.get("Link");
    if (existing) {
        headers.set("Link", `${existing}, ${serialized}`);
    } else {
        headers.set("Link", serialized);
    }
}

export async function fetch(
    request: Request,
    env: CloudflareEnv,
    ctx: ExecutionContext,
) {
    ensureMetricsReporter(env);
    const originalWaitUntil =
        typeof ctx?.waitUntil === "function"
            ? ctx.waitUntil.bind(ctx)
            : undefined;
    const waitUntilPromises: Promise<unknown>[] = [];
    const waitUntil = originalWaitUntil
        ? (promise: Promise<unknown>) => {
              const trackedPromise = Promise.resolve(promise);
              waitUntilPromises.push(trackedPromise);
              originalWaitUntil(trackedPromise);
          }
        : undefined;
    if (originalWaitUntil && waitUntil) {
        ctx.waitUntil = waitUntil as ExecutionContext["waitUntil"];
    }
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
    let finalResponse = response;

    if (cacheHint) {
        const headers = new Headers(response.headers);
        headers.delete(MARKETING_CACHE_HEADER);
        finalResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

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

    const contentType = finalResponse.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
        appendLinkHeaders(finalResponse.headers, collectLinkHints(env));
    }

    const flushAfterDeferredTasks = async () => {
        while (waitUntilPromises.length > 0) {
            const pendingPromises = waitUntilPromises.splice(
                0,
                waitUntilPromises.length,
            );
            await Promise.allSettled(pendingPromises);
        }
        await flushMetrics();
    };
    if (originalWaitUntil) {
        originalWaitUntil(
            flushAfterDeferredTasks().catch((error) => {
                console.error("[metrics] failed to flush after request", {
                    error,
                });
            }),
        );
    } else {
        await flushAfterDeferredTasks().catch((error) => {
            console.error("[metrics] failed to flush after request", { error });
        });
    }

    return finalResponse;
}

export default handler;
