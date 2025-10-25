import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { getAuth } from "./src/lib/auth";
import {
    getLocales,
    getRuntimeI18nConfig,
    localePrefix,
    setRuntimeI18nConfig,
} from "./src/i18n/config";
import { CSP_NONCE_HEADER, generateCspNonce } from "./src/lib/security/csp";
import { resolveAppUrl } from "./src/lib/seo";
import { getSiteSettingsPayload } from "./src/modules/admin/services/site-settings.service";

type SiteSettingsPayload = Awaited<ReturnType<typeof getSiteSettingsPayload>>;

let cachedI18nKey: string | null = null;
let cachedI18nMiddleware:
    | ReturnType<typeof createMiddleware>
    | null = null;

async function handleI18nRouting(
    request: NextRequest,
    settings?: SiteSettingsPayload,
) {
    try {
        const resolvedSettings =
            settings ?? (await getSiteSettingsPayload());
        setRuntimeI18nConfig({
            locales: resolvedSettings.enabledLanguages,
            defaultLocale: resolvedSettings.defaultLanguage,
        });
        const config = getRuntimeI18nConfig();
        const key = `${config.defaultLocale}|${config.locales.join(",")}`;
        if (!cachedI18nMiddleware || cachedI18nKey !== key) {
            cachedI18nMiddleware = createMiddleware({
                locales: [...config.locales],
                defaultLocale: config.defaultLocale,
                localePrefix,
            });
            cachedI18nKey = key;
        }
        return cachedI18nMiddleware(request);
    } catch (error) {
        console.warn("Falling back to default i18n middleware", { error });
        if (!cachedI18nMiddleware) {
            const fallbackConfig = getRuntimeI18nConfig();
            cachedI18nMiddleware = createMiddleware({
                locales: [...fallbackConfig.locales],
                defaultLocale: fallbackConfig.defaultLocale,
                localePrefix,
            });
            cachedI18nKey = `${fallbackConfig.defaultLocale}|${fallbackConfig.locales.join(",")}`;
        }
        return cachedI18nMiddleware(request);
    }
}

const CURRENT_API_VERSION = "v1";

function buildContentSecurityPolicy(nonce: string): string {
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com`,
        `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.cloudflare.com https://*.upstash.io",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
    ].join("; ");
}

function pickForwardedHeader(
    headers: Headers,
    key: string,
): string | undefined {
    const raw = headers.get(key);
    if (!raw) {
        return undefined;
    }
    return raw.split(",")[0]?.trim();
}

function normalizeProtocol(value: string): string {
    return value.replace(/:$/, "").toLowerCase();
}

function resolveCanonicalOrigin(
    settings: SiteSettingsPayload,
): URL | null {
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = resolveAppUrl(settings, { envAppUrl });
    try {
        return new URL(appUrl);
    } catch (error) {
        console.warn("Unable to resolve canonical origin", { error, appUrl });
        return null;
    }
}

function shouldEnforceOrigin(origin: URL | null): origin is URL {
    if (!origin) {
        return false;
    }

    return !["localhost", "127.0.0.1"].includes(origin.hostname);
}

function enforceCanonicalOrigin(
    request: NextRequest,
    settings: SiteSettingsPayload,
    nonce: string,
): NextResponse | null {
    const origin = resolveCanonicalOrigin(settings);
    if (!shouldEnforceOrigin(origin)) {
        return null;
    }

    const forwardedProto =
        pickForwardedHeader(request.headers, "x-forwarded-proto") ??
        request.nextUrl.protocol;
    const forwardedHost =
        pickForwardedHeader(request.headers, "x-forwarded-host") ??
        request.nextUrl.host;

    const requestProtocol = normalizeProtocol(forwardedProto);
    const canonicalProtocol = normalizeProtocol(origin.protocol);
    const requestHost = forwardedHost.toLowerCase();
    const canonicalHost = origin.host.toLowerCase();

    if (requestProtocol !== canonicalProtocol || requestHost !== canonicalHost) {
        const redirectUrl = new URL(request.nextUrl.href);
        redirectUrl.protocol = origin.protocol;
        redirectUrl.host = origin.host;
        const isApi = redirectUrl.pathname.startsWith("/api");
        const redirect = NextResponse.redirect(redirectUrl, 308);
        return applySecurityHeaders(
            redirect,
            { isApi, apiVersion: isApi ? CURRENT_API_VERSION : undefined },
            nonce,
        );
    }

    return null;
}

function applySecurityHeaders(
    response: NextResponse,
    options: { isApi: boolean; apiVersion?: string },
    nonce: string,
) {
    const headers = response.headers;

    const policy = buildContentSecurityPolicy(nonce);
    headers.set("Content-Security-Policy", policy);
    headers.set(CSP_NONCE_HEADER, nonce);
    const overrideKey = 'x-middleware-override-headers';
    const existingOverride = headers.get(overrideKey);
    if (existingOverride) {
        headers.set(overrideKey, `${existingOverride},${CSP_NONCE_HEADER}`);
    } else {
        headers.set(overrideKey, CSP_NONCE_HEADER);
    }
    headers.set(`x-middleware-request-${CSP_NONCE_HEADER}`, nonce);
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

function rewriteToCurrentVersion(request: NextRequest, nonce: string) {
    const rewriteUrl = request.nextUrl.clone();
    const suffix = request.nextUrl.pathname.slice("/api".length);
    rewriteUrl.pathname = `/api/${CURRENT_API_VERSION}${suffix}`;
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("X-API-Rewrite", CURRENT_API_VERSION);
    return applySecurityHeaders(response, {
        isApi: true,
        apiVersion: CURRENT_API_VERSION,
    }, nonce);
}

export async function middleware(request: NextRequest) {
    const nonce = generateCspNonce();
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set(CSP_NONCE_HEADER, nonce);
    const { pathname } = request.nextUrl;
    let siteSettings: SiteSettingsPayload | undefined;
    try {
        siteSettings = await getSiteSettingsPayload();
    } catch (error) {
        console.warn("Failed to load site settings in middleware", { error });
    }

    const canonicalRedirect = siteSettings
        ? enforceCanonicalOrigin(request, siteSettings, nonce)
        : null;
    if (canonicalRedirect) {
        return canonicalRedirect;
    }

    if (pathname.startsWith("/api")) {
        if (pathname === "/api" || pathname === "/api/") {
            const response = NextResponse.next({ request: { headers: forwardedHeaders } });
            return applySecurityHeaders(response, {
                isApi: true,
                apiVersion: CURRENT_API_VERSION,
            }, nonce);
        }

        const versionMatch = pathname.match(/^\/api\/(v\d+)(?:\/|$)/);
        if (!versionMatch) {
            return rewriteToCurrentVersion(request, nonce);
        }

        const response = NextResponse.next({ request: { headers: forwardedHeaders } });
        return applySecurityHeaders(response, {
            isApi: true,
            apiVersion: versionMatch[1],
        }, nonce);
    }

    let response = await handleI18nRouting(request, siteSettings);
    const runtimeLocales = getLocales();

    const segments = pathname.split("/").filter(Boolean);
    const maybeLocale = segments[0];
    const normalized = runtimeLocales.includes(maybeLocale as any)
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
                return applySecurityHeaders(redirect, { isApi: false }, nonce);
            }
        } catch (_error) {
            const redirect = NextResponse.redirect(
                new URL("/login", request.url),
            );
            return applySecurityHeaders(redirect, { isApi: false }, nonce);
        }
    }

    return applySecurityHeaders(response, { isApi: false }, nonce);
}

export const config = {
    matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
