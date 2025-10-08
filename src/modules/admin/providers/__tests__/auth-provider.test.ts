import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { adminAuthProvider } from "../auth-provider";

const originalFetch = global.fetch;
const fetchMock = vi.fn<typeof fetch>();

describe("adminAuthProvider", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock as unknown as typeof fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it("returns success on login without network calls", async () => {
        const result = await adminAuthProvider.login();
        expect(result).toEqual({ success: true });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("logs out and redirects to login", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(null, { status: 200 }) as unknown as Response,
        );

        const result = await adminAuthProvider.logout();
        expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });
        expect(result).toEqual({ success: true, redirectTo: "/login" });
    });

    it("swallows logout errors and still redirects", async () => {
        fetchMock.mockRejectedValueOnce(new Error("network"));

        const result = await adminAuthProvider.logout();
        expect(result).toEqual({ success: true, redirectTo: "/login" });
    });

    it("marks the session as authenticated when user data is returned", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ user: { id: "admin" } }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }) as unknown as Response,
        );

        const result = await adminAuthProvider.check();
        expect(result).toEqual({ authenticated: true });
    });

    it("redirects to login when session is missing", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(null, { status: 401 }) as unknown as Response,
        );

        const result = await adminAuthProvider.check();
        expect(result).toEqual({ authenticated: false, redirectTo: "/login" });
    });

    it("returns logout instruction on authentication errors", async () => {
        const result = await adminAuthProvider.onError({
            message: "Authentication required",
        });
        expect(result).toEqual({ logout: true, redirectTo: "/login" });
    });

    it("returns current identity when available", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    user: { id: "admin", email: "admin@example.com" },
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            ) as unknown as Response,
        );

        const identity = await adminAuthProvider.getIdentity();
        expect(identity).toEqual({ id: "admin", email: "admin@example.com" });
    });

    it("returns null identity when session is empty", async () => {
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({}), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }) as unknown as Response,
        );

        const identity = await adminAuthProvider.getIdentity();
        expect(identity).toBeNull();
    });
});
