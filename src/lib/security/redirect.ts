const INTERNAL_REDIRECT_BASE = "https://internal.invalid";
const INTERNAL_REDIRECT_BASE_URL = new URL(INTERNAL_REDIRECT_BASE);
const INTERNAL_REDIRECT_ORIGIN = INTERNAL_REDIRECT_BASE_URL.origin;
const INTERNAL_REDIRECT_PROTOCOL = INTERNAL_REDIRECT_BASE_URL.protocol;

function normalizeCandidate(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.includes("\n") || trimmed.includes("\r")) {
        return null;
    }

    return trimmed;
}

function isSameOrigin(url: URL): boolean {
    return (
        url.origin === INTERNAL_REDIRECT_ORIGIN &&
        url.protocol === INTERNAL_REDIRECT_PROTOCOL
    );
}

export function getSafeInternalRedirect(value: unknown): string | null {
    const candidate = normalizeCandidate(value);
    if (!candidate) {
        return null;
    }

    let parsed: URL;
    try {
        parsed = new URL(candidate, INTERNAL_REDIRECT_BASE);
    } catch {
        return null;
    }

    if (!isSameOrigin(parsed)) {
        return null;
    }

    const path = parsed.pathname || "/";

    if (!path.startsWith("/")) {
        return null;
    }

    return `${path}${parsed.search}${parsed.hash}`;
}

export function getSafeInternalRedirectOrDefault(
    value: unknown,
    fallback: string,
): string {
    const safeValue = getSafeInternalRedirect(value);
    if (safeValue) {
        return safeValue;
    }

    const safeFallback = getSafeInternalRedirect(fallback);
    if (safeFallback) {
        return safeFallback;
    }

    return "/";
}
