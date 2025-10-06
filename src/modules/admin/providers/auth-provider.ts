// Refine v5 不再需要显式的 AuthBindings 类型导入，按结构提供实现即可。

async function fetchSession() {
    const response = await fetch("/api/admin/session", {
        credentials: "include",
    });

    if (response.ok) {
        return response.json();
    }

    return null;
}

export const adminAuthProvider = {
    login: async () => ({ success: true }),
    logout: async () => {
        await fetch("/api/auth/logout", {
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
