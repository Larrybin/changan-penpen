import { createCloudflareRuntime } from "./cloudflare";
import {
    getRegisteredPlatformRuntime,
    setPlatformRuntime,
    type PlatformContext,
    type PlatformRuntime,
    type ResolvePlatformContextOptions,
} from "./runtime";

function ensureRuntime(): PlatformRuntime {
    let runtime = getRegisteredPlatformRuntime();
    if (!runtime) {
        runtime = createCloudflareRuntime();
        setPlatformRuntime(runtime);
    }
    return runtime;
}

export function getActivePlatformRuntime(): PlatformRuntime {
    return ensureRuntime();
}

export async function getPlatformContext(
    options?: ResolvePlatformContextOptions,
): Promise<PlatformContext> {
    const runtime = ensureRuntime();
    try {
        return await runtime.getContext(options);
    } catch (error) {
        console.warn("[platform] failed to resolve context", { error });
        return {};
    }
}

export async function getPlatformEnv<
    TEnv extends object = Record<string, unknown>,
>(options?: ResolvePlatformContextOptions): Promise<TEnv> {
    const context = await getPlatformContext(options);
    return (context.env ?? {}) as TEnv;
}

export async function getPlatformWaitUntil(
    options?: ResolvePlatformContextOptions,
): Promise<((promise: Promise<unknown>) => void) | undefined> {
    const context = await getPlatformContext(options);
    return context.waitUntil;
}

export { createCloudflareRuntime };
export { createNodePlatformRuntime } from "./node";
export { getRegisteredPlatformRuntime, setPlatformRuntime } from "./runtime";
export type { PlatformContext, PlatformRuntime, ResolvePlatformContextOptions } from "./runtime";
