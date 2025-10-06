import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateAdminMetadata } from "@/modules/admin/metadata";
import {
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

    if (!token || !config.entryToken || !isEntryTokenValid(token, config)) {
        redirect("/login?admin=1&error=invalid-entry");
    }

    const cookieStore = await cookies();
    cookieStore.set({
        name: "admin-entry",
        value: config.entryToken,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
    });

    redirect("/login?admin=1&admin-entry=granted");
}
