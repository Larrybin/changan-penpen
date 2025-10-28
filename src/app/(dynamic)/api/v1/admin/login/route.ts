import { NextResponse } from "next/server";
import handleApiError from "@/lib/api-error";
import { getSafeInternalRedirectOrDefault } from "@/lib/security/redirect";
import {
    createAdminEntryCookieInit,
    getAdminAccessConfig,
    isEmailAllowed,
    isEntryTokenValid,
} from "@/modules/admin/utils/admin-access";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getPlatformEnv } from "@/lib/platform/context";

function normalizeString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
        >;
        const email = normalizeString(body.email);
        const password = normalizeString(body.password);
        const entryToken = normalizeString(body.entryToken);
        const redirectTo = normalizeString(body.redirectTo);
        const safeRedirect = getSafeInternalRedirectOrDefault(
            redirectTo,
            "/admin",
        );

        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 },
            );
        }

        const auth = await getAuthInstance();
        await auth.api.signInEmail({
            body: { email, password },
        });

        const config = await getAdminAccessConfig();
        if (!isEmailAllowed(email, config)) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 },
            );
        }

        const response = NextResponse.json({
            success: true,
            redirectTo: safeRedirect,
        });

        if (config.entryToken) {
            if (!isEntryTokenValid(entryToken, config)) {
                return NextResponse.json(
                    { message: "Invalid entry token" },
                    { status: 401 },
                );
            }

            const env = (await getPlatformEnv({ async: true })) as unknown as CloudflareEnv;
            const cookie = createAdminEntryCookieInit({
                token: entryToken,
                headers: request.headers,
                env,
            });
            response.cookies.set(cookie.name, cookie.value, {
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                secure: cookie.secure,
                path: cookie.path,
                maxAge: cookie.maxAge,
            });
        }

        return response;
    } catch (error) {
        console.error("[api/admin/login] error", error);
        return handleApiError(error);
    }
}
