import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCloudflareContextMock = vi.fn();
const getDbMock = vi.fn();
const drizzleAdapterMock = vi.fn();
const nextCookiesMock = vi.fn();
const headersMock = vi.fn();
const betterAuthMock = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

vi.mock("@/db", () => ({
    getDb: getDbMock,
}));

vi.mock("better-auth/adapters/drizzle", () => ({
    drizzleAdapter: drizzleAdapterMock,
}));

vi.mock("better-auth/next-js", () => ({
    nextCookies: nextCookiesMock,
}));

vi.mock("next/headers", () => ({
    headers: headersMock,
}));

vi.mock("better-auth", () => ({
    betterAuth: betterAuthMock,
}));

describe("auth-utils", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        getCloudflareContextMock.mockResolvedValue({
            env: {
                BETTER_AUTH_SECRET: "secret",
                GOOGLE_CLIENT_ID: "google-id",
                GOOGLE_CLIENT_SECRET: "google-secret",
            },
        });
        getDbMock.mockResolvedValue({} as never);
        drizzleAdapterMock.mockReturnValue({ adapter: true } as never);
        nextCookiesMock.mockReturnValue("plugin" as never);
        headersMock.mockResolvedValue(new Headers());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    async function loadModule() {
        return await import("../auth-utils");
    }

    it("returns the current user when a session exists", async () => {
        const sessionMock = vi.fn().mockResolvedValue({
            user: {
                id: "user-1",
                name: "Test User",
                email: "user@example.com",
            },
        });
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { getCurrentUser } = await loadModule();
        const user = await getCurrentUser();

        expect(user).toEqual({
            id: "user-1",
            name: "Test User",
            email: "user@example.com",
        });
        expect(sessionMock).toHaveBeenCalledTimes(1);
    });

    it("returns null when session is missing or request fails", async () => {
        const sessionMock = vi
            .fn()
            .mockResolvedValueOnce(null)
            .mockRejectedValueOnce(new Error("network"));
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { getCurrentUser } = await loadModule();
        expect(await getCurrentUser()).toBeNull();
        expect(await getCurrentUser()).toBeNull();
    });

    it("throws from requireAuth when the user is unauthenticated", async () => {
        const sessionMock = vi.fn().mockResolvedValue(null);
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { requireAuth } = await loadModule();
        await expect(requireAuth()).rejects.toThrow("Authentication required");
    });

    it("resolves requireAuth and isAuthenticated when the user exists", async () => {
        const sessionMock = vi.fn().mockResolvedValue({
            user: {
                id: "user-2",
                name: "Jane",
                email: "jane@example.com",
            },
        });
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { requireAuth, isAuthenticated } = await loadModule();
        await expect(requireAuth()).resolves.toEqual({
            id: "user-2",
            name: "Jane",
            email: "jane@example.com",
        });
        expect(await isAuthenticated()).toBe(true);
    });

    it("caches the auth instance across calls", async () => {
        const sessionMock = vi.fn().mockResolvedValue({ user: null });
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { getAuthInstance } = await loadModule();
        const first = await getAuthInstance();
        const second = await getAuthInstance();

        expect(first).toBe(second);
        expect(betterAuthMock).toHaveBeenCalledTimes(1);
    });

    it("returns null session when fetching session fails", async () => {
        const sessionMock = vi.fn().mockRejectedValue(new Error("boom"));
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { getSession } = await loadModule();
        const result = await getSession();
        expect(result).toBeNull();
    });

    it("logs a warning when Google OAuth configuration is incomplete", async () => {
        const warnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => undefined);
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                BETTER_AUTH_SECRET: "secret",
                GOOGLE_CLIENT_ID: "google-only",
            },
        });
        const sessionMock = vi.fn().mockResolvedValue({ user: null });
        betterAuthMock.mockReturnValue({ api: { getSession: sessionMock } });

        const { getAuthInstance } = await loadModule();
        await getAuthInstance();

        expect(warnSpy).toHaveBeenCalledWith(
            "GOOGLE_CLIENT_SECRET is missing; Google OAuth provider will be disabled.",
        );
    });
});
