import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AuthUser } from "@/modules/auth/models/user.model";

export interface AdminAccessConfig {
    allowedEmails: string[];
    entryToken: string | null;
}

export async function getAdminAccessConfig(): Promise<AdminAccessConfig> {
    const { env } = await getCloudflareContext();
    const allowedEmails = env.ADMIN_ALLOWED_EMAILS?.split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const entryToken = env.ADMIN_ENTRY_TOKEN
        ? env.ADMIN_ENTRY_TOKEN.trim()
        : null;

    return {
        allowedEmails: allowedEmails ?? [],
        entryToken,
    };
}

export function isEmailAllowed(
    email: string | null | undefined,
    config: AdminAccessConfig,
) {
    if (!config.allowedEmails.length) {
        return true;
    }
    if (!email) {
        return false;
    }
    return config.allowedEmails.includes(email.toLowerCase());
}

export function isEntryTokenValid(
    token: string | null | undefined,
    config: AdminAccessConfig,
) {
    if (!config.entryToken) {
        return false;
    }
    return token === config.entryToken;
}

export async function requireAdminForPage(user: AuthUser) {
    const config = await getAdminAccessConfig();
    if (!isEmailAllowed(user.email, config)) {
        redirect("/login?admin=1");
    }

    const cookieStore = await cookies();
    const entryCookie = cookieStore.get("admin-entry");

    if (!entryCookie || !isEntryTokenValid(entryCookie.value, config)) {
        redirect("/login?admin=1");
    }
}

export async function checkAdminAccessFromHeaders(
    headers: Headers,
    email: string | null | undefined,
) {
    const config = await getAdminAccessConfig();
    if (!isEmailAllowed(email, config)) {
        return false;
    }

    const cookieHeader = headers.get("cookie") ?? "";
    const token = extractEntryCookie(cookieHeader);
    return isEntryTokenValid(token, config);
}

export function extractEntryCookie(cookieHeader: string) {
    const parts = cookieHeader.split(";");
    for (const part of parts) {
        const [key, value] = part.trim().split("=");
        if (key === "admin-entry") {
            return decodeURIComponent(value ?? "");
        }
    }
    return null;
}
