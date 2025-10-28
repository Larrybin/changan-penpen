import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { getPlatformEnv } from "@/lib/platform/context";

export interface AdminAccessConfig {
    allowedEmails: string[];
    entryToken: string | null;
}

type CloudflareBindings = CloudflareEnv;

type CookieInit = {
    name: string;
    value: string;
    httpOnly?: boolean;
    sameSite?: "lax" | "strict" | "none";
    secure?: boolean;
    path?: string;
    maxAge?: number;
};

function parseForwardedProto(headers: Headers): string[] {
    const forwarded = headers.get("x-forwarded-proto");
    if (!forwarded) {
        return [];
    }
    return forwarded
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function isHttpsFromHeaders(headers: Headers): boolean {
    const forwardedValues = parseForwardedProto(headers);
    if (forwardedValues.includes("https")) {
        return true;
    }
    const cfVisitor = headers.get("cf-visitor");
    if (cfVisitor) {
        try {
            const parsed = JSON.parse(cfVisitor) as { scheme?: string };
            if (parsed.scheme?.toLowerCase() === "https") {
                return true;
            }
        } catch (error) {
            console.warn("Failed to parse cf-visitor header", { error });
        }
    }
    return false;
}

function shouldDefaultSecure(env: CloudflareBindings): boolean {
    const envRecord = env as unknown as Record<string, unknown>;
    const forced = String(
        envRecord.ADMIN_FORCE_SECURE_COOKIES ?? "",
    ).toLowerCase();
    if (forced === "true") {
        return true;
    }
    if (forced === "false") {
        return false;
    }
    const mode = String(envRecord.NEXTJS_ENV ?? "").toLowerCase();
    return mode !== "development" && mode !== "test";
}

export function createAdminEntryCookieInit({
    token,
    headers,
    env,
}: {
    token: string;
    headers: Headers;
    env: CloudflareBindings;
}): CookieInit {
    const secure = isHttpsFromHeaders(headers) || shouldDefaultSecure(env);
    return {
        name: "admin-entry",
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 60 * 60 * 24,
    } satisfies CookieInit;
}

export async function getAdminAccessConfig(): Promise<AdminAccessConfig> {
    const env = (await getPlatformEnv({ async: true })) as unknown as CloudflareEnv;
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
        return true;
    }
    return token === config.entryToken;
}

export async function requireAdminForPage(user: AuthUser) {
    const config = await getAdminAccessConfig();
    if (!isEmailAllowed(user.email, config)) {
        redirect("/login?admin=1");
    }

    if (!config.entryToken) {
        return;
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

    if (!config.entryToken) {
        return true;
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
