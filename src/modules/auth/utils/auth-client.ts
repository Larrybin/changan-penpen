import { createAuthClient } from "better-auth/react";

const FALLBACK_DEV_ORIGIN = "http://localhost:3000";

function normalizeUrl(url: string | undefined): string | undefined {
    if (!url) {
        return undefined;
    }
    const trimmed = url.trim();
    if (!trimmed) {
        return undefined;
    }
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
}

function resolveBaseURL(): string {
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
    }

    const explicitUrl =
        normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
        normalizeUrl(process.env.BETTER_AUTH_URL) ??
        normalizeUrl(process.env.VERCEL_URL);

    if (explicitUrl) {
        return explicitUrl;
    }

    if (process.env.NODE_ENV !== "production") {
        return FALLBACK_DEV_ORIGIN;
    }

    console.warn(
        "[authClient] NEXT_PUBLIC_APP_URL is not configured; falling back to localhost",
    );
    return FALLBACK_DEV_ORIGIN;
}

// Create the auth client for client-side usage
export const authClient = createAuthClient({
    baseURL: resolveBaseURL(),
});

export { resolveBaseURL as __resolveAuthBaseURLForTests };
