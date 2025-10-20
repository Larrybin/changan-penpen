export const CSP_NONCE_HEADER = "x-csp-nonce" as const;

export function generateCspNonce(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID().replace(/-/g, "");
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function readCspNonce(headers: Headers): string | undefined {
    const value = headers.get(CSP_NONCE_HEADER);
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
