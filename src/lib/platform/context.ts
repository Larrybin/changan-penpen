import { getCloudflareContext } from "@opennextjs/cloudflare";

type PlatformExecutionContext = ExecutionContext;

interface PlatformContextResult {
    env?: Record<string, unknown>;
    ctx?: PlatformExecutionContext;
}

interface ResolveOptions {
    async?: boolean;
}

function isExecutionContext(value: unknown): value is PlatformExecutionContext {
    return (
        typeof value === "object" &&
        value !== null &&
        "waitUntil" in value &&
        typeof (value as PlatformExecutionContext).waitUntil === "function"
    );
}

export async function getPlatformContext(
    options: ResolveOptions = { async: true },
): Promise<PlatformContextResult> {
    try {
        const context =
            options?.async === false
                ? getCloudflareContext({ async: false })
                : await getCloudflareContext({ async: true });
        if (!context) {
            return {};
        }

        const env =
            context.env && typeof context.env === "object"
                ? (context.env as unknown as Record<string, unknown>)
                : undefined;
        const ctx = isExecutionContext(context.ctx) ? context.ctx : undefined;

        return { env, ctx } satisfies PlatformContextResult;
    } catch (error) {
        console.warn("[platform] failed to resolve Cloudflare context", {
            error,
        });
        return {};
    }
}

export async function getPlatformEnv<
    TEnv extends Record<string, unknown> = Record<string, unknown>,
>(options?: ResolveOptions): Promise<TEnv> {
    const context = await getPlatformContext(options);
    return (context.env ?? {}) as TEnv;
}

export async function getPlatformWaitUntil(
    options?: ResolveOptions,
): Promise<PlatformExecutionContext["waitUntil"] | undefined> {
    const context = await getPlatformContext(options);
    return context.ctx?.waitUntil?.bind(context.ctx);
}
