import type { AuthBindings } from "@refinedev/core";

async function fetchSession() {
    const response = await fetch("/api/admin/session", {
        credentials: "include",
    });

    if (response.ok) {
        return response.json();
    }

    return null;
}

export const adminAuthProvider: AuthBindings = {
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
        const session = await fetchSession();

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
    onError: async (error) => {
        if (error?.message === "Authentication required") {
            return {
                logout: true,
                redirectTo: "/login",
            };
        }

        return {};
    },
    getIdentity: async () => {
        const session = await fetchSession();

        if (session?.user) {
            return session.user;
        }

        return null;
    },
    getPermissions: async () => null,
};
