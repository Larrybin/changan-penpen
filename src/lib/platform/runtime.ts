export interface ResolvePlatformContextOptions {
    async?: boolean;
}

export interface PlatformContext {
    env?: Record<string, unknown>;
    waitUntil?: (promise: Promise<unknown>) => void;
}

export interface PlatformRuntime {
    readonly name: string;
    getContext(
        options?: ResolvePlatformContextOptions,
    ): Promise<PlatformContext>;
}

let activeRuntime: PlatformRuntime | null = null;

export function getRegisteredPlatformRuntime(): PlatformRuntime | null {
    return activeRuntime;
}

export function setPlatformRuntime(runtime: PlatformRuntime | null): void {
    activeRuntime = runtime;
}
