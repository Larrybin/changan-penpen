const GLOBAL_FLAG_KEY = "__FAULT_INJECTION__";

function getGlobalFlag(): string | undefined {
    if (typeof globalThis === "undefined") {
        return undefined;
    }
    const injected = (globalThis as Record<string, unknown>)[GLOBAL_FLAG_KEY];
    if (typeof injected === "string") {
        return injected;
    }
    if (typeof process !== "undefined" && process.env?.FAULT_INJECTION) {
        return process.env.FAULT_INJECTION;
    }
    return undefined;
}

export function isFaultEnabled(identifier: string): boolean {
    const flag = getGlobalFlag();
    if (!flag) {
        return false;
    }

    const normalized = flag
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (normalized.includes("*")) {
        return true;
    }

    return normalized.includes(identifier);
}

export function maybeInjectFault(identifier: string, error?: () => Error): void {
    if (!isFaultEnabled(identifier)) {
        return;
    }

    throw error ? error() : new Error(`[fault-injection] ${identifier}`);
}

export function enableFaultInjection(identifier: string): void {
    if (typeof globalThis === "undefined") {
        return;
    }

    const flag = getGlobalFlag();
    const entries = flag ? flag.split(",").map((item) => item.trim()) : [];
    if (!entries.includes(identifier)) {
        entries.push(identifier);
    }
    (globalThis as Record<string, unknown>)[GLOBAL_FLAG_KEY] = entries.join(",");
}
