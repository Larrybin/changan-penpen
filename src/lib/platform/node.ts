import type {
    PlatformContext,
    PlatformRuntime,
    ResolvePlatformContextOptions,
} from "./runtime";

export interface NodePlatformRuntimeOptions {
    env?: Record<string, unknown> | (() => Record<string, unknown>);
    waitUntil?: (promise: Promise<unknown>) => void;
}

class NodePlatformRuntime implements PlatformRuntime {
    public readonly name = "node";
    private readonly envProvider?: () => Record<string, unknown>;
    private readonly waitUntil?: (promise: Promise<unknown>) => void;

    constructor(options: NodePlatformRuntimeOptions = {}) {
        if (typeof options.env === "function") {
            this.envProvider = options.env;
        } else if (options.env) {
            const snapshot = { ...options.env };
            this.envProvider = () => ({ ...snapshot });
        } else if (
            typeof process !== "undefined" &&
            typeof process.env === "object"
        ) {
            this.envProvider = () =>
                ({ ...process.env }) as Record<string, unknown>;
        }
        this.waitUntil = options.waitUntil;
    }

    async getContext(
        _options?: ResolvePlatformContextOptions,
    ): Promise<PlatformContext> {
        const env = this.envProvider?.();
        return { env, waitUntil: this.waitUntil };
    }
}

export function createNodePlatformRuntime(
    options: NodePlatformRuntimeOptions = {},
): PlatformRuntime {
    return new NodePlatformRuntime(options);
}
