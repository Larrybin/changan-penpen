import { secureRandomString } from "@/lib/random";

export const CSP_NONCE_HEADER = "x-csp-nonce" as const;

export function generateCspNonce(): string {
    const cryptoApi =
        typeof globalThis !== "undefined"
            ? (globalThis as { crypto?: Crypto }).crypto
            : undefined;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
        return cryptoApi.randomUUID().replace(/-/g, "");
    }

    try {
        return secureRandomString(32);
    } catch (error) {
        const message =
            "Unable to generate a CSP nonce because secure randomness is not available. Ensure Web Crypto or Node crypto support is enabled.";
        if (error instanceof Error) {
            throw new Error(message, { cause: error });
        }
        throw new Error(message);
    }
}

export function readCspNonce(headers: Headers): string | undefined {
    const value = headers.get(CSP_NONCE_HEADER);
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
