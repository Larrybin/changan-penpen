// Refine v5 不再需要显式的 AuthBindings 类型导入，按结构提供实现即可。
import { getSafeInternalRedirectOrDefault } from "@/lib/security/redirect";

async function fetchSession() {
    const response = await fetch("/api/v1/admin/session", {
        credentials: "include",
    });

    if (response.ok) {
        return response.json();
    }

    return null;
}

export const adminAuthProvider = {
    login: async (params?: {
        email?: string;
        password?: string;
        entryToken?: string;
        redirectTo?: string;
    }) => {
        try {
            const response = await fetch("/api/v1/admin/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params ?? {}),
            });

            const payload = (await response.json().catch(() => ({}))) as {
                success?: boolean;
                message?: string;
                redirectTo?: string;
            };

            if (!response.ok || payload.success !== true) {
                return {
                    success: false,
                    error: payload.message ?? "Unable to login",
                } as const;
            }

            return {
                success: true,
                redirectTo: getSafeInternalRedirectOrDefault(
                    payload.redirectTo,
                    "/admin",
                ),
            } as const;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unable to login";
            return { success: false, error: message } as const;
        }
    },
    logout: async () => {
        await fetch("/api/v1/auth/logout", {
            method: "POST",
            credentials: "include",
        }).catch(() => undefined);

        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async () => {
        const session = (await fetchSession()) as {
            user?: Record<string, unknown>;
        } | null;

        if (session?.user) {
            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },
    onError: async (error: unknown) => {
        const message =
            typeof error === "object" && error && "message" in error
                ? (error as { message?: unknown }).message
                : undefined;
        if (
            typeof message === "string" &&
            message === "Authentication required"
        ) {
            return {
                logout: true,
                redirectTo: "/login",
            };
        }

        return {};
    },
    getIdentity: async () => {
        const session = (await fetchSession()) as {
            user?: Record<string, unknown>;
        } | null;

        if (session?.user) {
            return session.user;
        }

        return null;
    },
    getPermissions: async () => null,
} as const;
