import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const cookiesMock = vi.fn();
const getCloudflareContextMock = vi.fn();

vi.mock("next/navigation", () => ({
    redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
    cookies: cookiesMock,
}));

vi.mock("@opennextjs/cloudflare", () => ({
    getCloudflareContext: getCloudflareContextMock,
}));

describe("admin access utils", () => {
    beforeEach(() => {
        redirectMock.mockClear();
        cookiesMock.mockClear();
        getCloudflareContextMock.mockClear();
        getCloudflareContextMock.mockResolvedValue({
            env: {
                ADMIN_ALLOWED_EMAILS: "admin@example.com, Foo@Example.com",
                ADMIN_ENTRY_TOKEN: "secret",
            },
        });
        cookiesMock.mockImplementation(async () => ({
            get: () => undefined,
        }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("标准化邮件白名单", async () => {
        const { getAdminAccessConfig } = await import("./admin-access");
        const config = await getAdminAccessConfig();
        expect(config.allowedEmails).toEqual([
            "admin@example.com",
            "foo@example.com",
        ]);
        expect(config.entryToken).toBe("secret");
    });

    it("isEmailAllowed 支持大小写", async () => {
        const { isEmailAllowed } = await import("./admin-access");
        const config = { allowedEmails: ["user@example.com"], entryToken: null };
        expect(isEmailAllowed("USER@EXAMPLE.COM", config)).toBe(true);
        expect(isEmailAllowed("", config)).toBe(false);
    });

    it("isEntryTokenValid 在未配置时总是通过", async () => {
        const { isEntryTokenValid } = await import("./admin-access");
        expect(
            isEntryTokenValid(null, { allowedEmails: [], entryToken: null }),
        ).toBe(true);
        expect(
            isEntryTokenValid("abc", { allowedEmails: [], entryToken: "abc" }),
        ).toBe(true);
        expect(
            isEntryTokenValid("abc", { allowedEmails: [], entryToken: "def" }),
        ).toBe(false);
    });

    it("extractEntryCookie 能处理缺省与编码", async () => {
        const { extractEntryCookie } = await import("./admin-access");
        expect(extractEntryCookie("foo=1; admin-entry=token%201")).toBe(
            "token 1",
        );
        expect(extractEntryCookie("foo=1")).toBeNull();
    });

    it("checkAdminAccessFromHeaders 正确校验 token", async () => {
        const { checkAdminAccessFromHeaders } = await import("./admin-access");
        const headers = new Headers({ cookie: "admin-entry=secret" });
        expect(await checkAdminAccessFromHeaders(headers, "admin@example.com"))
            .toBe(true);

        const invalid = new Headers({ cookie: "admin-entry=wrong" });
        expect(
            await checkAdminAccessFromHeaders(invalid, "admin@example.com"),
        ).toBe(false);
    });

    it("requireAdminForPage 在未授权时跳转", async () => {
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                ADMIN_ALLOWED_EMAILS: "foo@example.com",
                ADMIN_ENTRY_TOKEN: "",
            },
        });
        const module = await import("./admin-access");
        await module.requireAdminForPage({ email: null } as any);
        expect(redirectMock).toHaveBeenCalledWith("/login?admin=1");
    });

    it("requireAdminForPage 会校验 entry token", async () => {
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                ADMIN_ALLOWED_EMAILS: "user@example.com",
                ADMIN_ENTRY_TOKEN: "secret",
            },
        });
        const module = await import("./admin-access");
        cookiesMock.mockImplementation(async () => ({
            get: () => ({ value: "wrong" }),
        }));
        await module.requireAdminForPage({ email: "user@example.com" } as any);
        expect(redirectMock).toHaveBeenCalledWith("/login?admin=1");
    });

    it("requireAdminForPage 通过授权", async () => {
        getCloudflareContextMock.mockResolvedValueOnce({
            env: {
                ADMIN_ALLOWED_EMAILS: "user@example.com",
                ADMIN_ENTRY_TOKEN: "secret",
            },
        });
        const module = await import("./admin-access");
        cookiesMock.mockImplementation(async () => ({
            get: () => ({ value: "secret" }),
        }));
        await module.requireAdminForPage({ email: "user@example.com" } as any);
        expect(redirectMock).not.toHaveBeenCalled();
    });
});
