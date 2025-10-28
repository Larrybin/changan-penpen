import { getCloudflareContext } from "@opennextjs/cloudflare";

import type {
    PlatformContext,
    PlatformRuntime,
    ResolvePlatformContextOptions,
} from "./runtime";

function isExecutionContext(value: unknown): value is ExecutionContext {
    return (
        typeof value === "object" &&
        value !== null &&
        "waitUntil" in value &&
        typeof (value as ExecutionContext).waitUntil === "function"
    );
}

class CloudflarePlatformRuntime implements PlatformRuntime {
    public readonly name = "cloudflare";

    async getContext(
        options: ResolvePlatformContextOptions = { async: true },
    ): Promise<PlatformContext> {
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
            const executionContext = isExecutionContext(context.ctx)
                ? context.ctx
                : undefined;
            const waitUntil =
                executionContext?.waitUntil?.bind(executionContext);

            return { env, waitUntil } satisfies PlatformContext;
        } catch (error) {
            console.warn("[platform:cloudflare] failed to resolve context", {
                error,
            });
            return {};
        }
    }
}

export function createCloudflareRuntime(): PlatformRuntime {
    return new CloudflarePlatformRuntime();
}
