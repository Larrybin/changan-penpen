import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import {
    createAdminEntryCookieInit,
    getAdminAccessConfig,
    isEntryTokenValid,
} from "@/modules/admin/utils/admin-access";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ token: string }> },
) {
    const { token } = await params;

    const config = await getAdminAccessConfig();

    if (!config.entryToken) {
        return NextResponse.redirect(
            new URL("/login?admin=1&admin-entry=granted", request.url),
            302,
        );
    }

    if (!token || !isEntryTokenValid(token, config)) {
        return NextResponse.redirect(
            new URL("/login?admin=1&error=invalid-entry", request.url),
            302,
        );
    }

    const { env } = await getCloudflareContext({ async: true });
    const cookieInit = createAdminEntryCookieInit({
        token: config.entryToken,
        headers: request.headers,
        env,
    });

    const res = NextResponse.redirect(
        new URL("/login?admin=1&admin-entry=granted", request.url),
        302,
    );
    res.cookies.set(cookieInit.name, cookieInit.value, {
        httpOnly: cookieInit.httpOnly,
        sameSite: cookieInit.sameSite,
        secure: cookieInit.secure,
        path: cookieInit.path,
        maxAge: cookieInit.maxAge,
    });
    return res;
}
