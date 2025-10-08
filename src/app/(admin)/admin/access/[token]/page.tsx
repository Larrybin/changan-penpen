import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { generateAdminMetadata } from "@/modules/admin/metadata";
import {
    createAdminEntryCookieInit,
    getAdminAccessConfig,
    isEntryTokenValid,
} from "@/modules/admin/utils/admin-access";

interface Params {
    token: string;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Params>;
}): Promise<Metadata> {
    const { token } = await params;
    const path = token
        ? `/admin/access/${encodeURIComponent(token)}`
        : "/admin/access";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default async function AdminEntryPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { token } = await params;
    const config = await getAdminAccessConfig();

    if (!config.entryToken) {
        redirect("/login?admin=1&admin-entry=granted");
    }

    if (!token || !isEntryTokenValid(token, config)) {
        redirect("/login?admin=1&error=invalid-entry");
    }

    const cookieStore = await cookies();
    const requestHeaders = await headers();
    const { env } = await getCloudflareContext({ async: true });
    const cookieInit = createAdminEntryCookieInit({
        token: config.entryToken,
        headers: requestHeaders,
        env,
    });
    cookieStore.set(cookieInit.name, cookieInit.value, cookieInit);

    redirect("/login?admin=1&admin-entry=granted");
}
