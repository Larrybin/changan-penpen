import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getAuth } from "./src/lib/auth";
import { defaultLocale, locales } from "./src/i18n/config";

const handleI18nRouting = createMiddleware({
    locales: Array.from(locales),
    defaultLocale,
    localePrefix: "as-needed",
});

async function middlewareImpl(request: NextRequest) {
    // Run i18n routing first
    const i18nResponse = handleI18nRouting(request);

    // Normalize path to check protected routes without locale prefix
    const pathname = request.nextUrl.pathname;
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
                return NextResponse.redirect(new URL("/login", request.url));
            }
        } catch (_error) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return i18nResponse;
}

const wrap = (Sentry as any).withSentry ?? ((fn: any) => fn);
export const middleware = wrap(middlewareImpl, { name: "middleware" });

export const config = {
    // Run on all app routes, exclude Next internals, files and API
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
