import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { getAuth } from "./src/lib/auth";
import { defaultLocale, locales } from "./src/i18n/config";

const handleI18nRouting = createMiddleware({
    locales: Array.from(locales),
    defaultLocale,
    localePrefix: "as-needed",
});

const CURRENT_API_VERSION = "v1";
const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.cloudflare.com https://*.upstash.io",
    "frame-ancestors 'none'",
    "form-action 'self'",
].join("; ");

function applySecurityHeaders(
    response: NextResponse,
    options: { isApi: boolean; apiVersion?: string },
) {
    const headers = response.headers;

    if (!headers.has("Content-Security-Policy")) {
        headers.set("Content-Security-Policy", CSP);
    }
    headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
    );
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set(
        "Permissions-Policy",
        "camera=(), geolocation=(), microphone=(), payment=()",
    );

    if (options.isApi) {
        headers.set("API-Version", options.apiVersion ?? CURRENT_API_VERSION);
        headers.set("Supported-Versions", CURRENT_API_VERSION);
    }

    return response;
}

function rewriteToCurrentVersion(request: NextRequest) {
    const rewriteUrl = request.nextUrl.clone();
    const suffix = request.nextUrl.pathname.slice("/api".length);
    rewriteUrl.pathname = `/api/${CURRENT_API_VERSION}${suffix}`;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("X-API-Rewrite", CURRENT_API_VERSION);
    return applySecurityHeaders(response, {
        isApi: true,
        apiVersion: CURRENT_API_VERSION,
    });
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api")) {
        if (pathname === "/api" || pathname === "/api/") {
            const response = NextResponse.next();
            return applySecurityHeaders(response, {
                isApi: true,
                apiVersion: CURRENT_API_VERSION,
            });
        }

        const versionMatch = pathname.match(/^\/api\/(v\d+)(?:\/|$)/);
        if (!versionMatch) {
            return rewriteToCurrentVersion(request);
        }

        const response = NextResponse.next();
        return applySecurityHeaders(response, {
            isApi: true,
            apiVersion: versionMatch[1],
        });
    }

    let response = handleI18nRouting(request);

    const segments = pathname.split("/").filter(Boolean);
    const maybeLocale = segments[0];
    const normalized = locales.includes(maybeLocale as any)
        ? "/" + segments.slice(1).join("/")
        : pathname;

    if (normalized.startsWith("/dashboard")) {
        try {
            const auth = await getAuth();
            const session = await auth.api.getSession({
                headers: request.headers,
            });

            if (!session) {
                const redirect = NextResponse.redirect(
                    new URL("/login", request.url),
                );
                return applySecurityHeaders(redirect, { isApi: false });
            }
        } catch (_error) {
            const redirect = NextResponse.redirect(
                new URL("/login", request.url),
            );
            return applySecurityHeaders(redirect, { isApi: false });
        }
    }

    return applySecurityHeaders(response, { isApi: false });
}

export const config = {
    matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
