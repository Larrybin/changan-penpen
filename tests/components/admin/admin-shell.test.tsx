import type { ReactNode } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";

import type { AuthUser } from "@/modules/auth/models/user.model";
import { AdminShell } from "@/modules/admin/components/admin-shell";
import { DEFAULT_ADMIN_MENU_GROUP } from "@/modules/admin/constants";

import { customRender, setupUserEvent } from "../setup";

const currentPath = vi.hoisted(() => ({ value: "/admin/dashboard" }));
const mockPush = vi.hoisted(() => vi.fn());
const buildAdminMenuGroupsMock = vi.hoisted(() => vi.fn());
const logoutMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    usePathname: () => currentPath.value,
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
}));

vi.mock("@/modules/admin/constants", async () => {
    const actual = await vi.importActual<typeof import("@/modules/admin/constants")>(
        "@/modules/admin/constants",
    );

    return {
        ...actual,
        buildAdminMenuGroups: buildAdminMenuGroupsMock,
    };
});

vi.mock("@/modules/admin/providers/auth-provider", () => ({
    adminAuthProvider: {
        logout: (...args: unknown[]) => logoutMock(...args),
    },
}));

vi.mock("@/components/layout/page-container", () => ({
    PageContainer: ({ children }: { children: ReactNode }) => (
        <div data-testid="page-container">{children}</div>
    ),
}));

vi.mock("@/lib/toast", () => {
    const mockToast = Object.assign(vi.fn(), {
        error: toastErrorMock,
    });

    return {
        toast: mockToast,
        default: mockToast,
    };
});

describe("AdminShell", () => {
    let user: ReturnType<typeof setupUserEvent>;
    let mockUser: AuthUser;

    beforeEach(() => {
        currentPath.value = "/admin/dashboard";
        mockPush.mockReset();
        logoutMock.mockReset();
        toastErrorMock.mockReset();
        buildAdminMenuGroupsMock.mockReset();
        buildAdminMenuGroupsMock.mockReturnValue([
            {
                name: "内容管理",
                items: [
                    { name: "dashboard", label: "仪表盘", href: "/admin/dashboard" },
                    { name: "todos", label: "Todos管理", href: "/admin/todos" },
                ],
            },
            {
                name: "系统管理",
                items: [
                    { name: "users", label: "用户管理", href: "/admin/users" },
                    { name: "settings", label: "系统设置", href: "/admin/settings" },
                ],
            },
        ]);
        logoutMock.mockResolvedValue(undefined);

        user = setupUserEvent();
        mockUser = {
            id: "admin-user-id",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    const renderShell = () =>
        customRender(
            <AdminShell user={mockUser}>
                <div data-testid="admin-shell-content">内容区域</div>
            </AdminShell>,
        );

    it("renders the navigation layout with user information", () => {
        renderShell();

        expect(screen.getByText("站长仪表盘")).toBeInTheDocument();
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
        expect(screen.getByRole("navigation")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /退出登录/i })).toBeInTheDocument();
        expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
        expect(screen.getByTestId("page-container")).toBeInTheDocument();
        expect(screen.getByTestId("admin-shell-content")).toBeInTheDocument();
    });

    it("highlights the active menu item for the current route", () => {
        currentPath.value = "/admin/todos";

        renderShell();

        expect(screen.getByRole("link", { name: "Todos管理" })).toHaveClass(
            "bg-primary text-primary-foreground",
        );
    });

    it("falls back to the default group name when it is missing", () => {
        buildAdminMenuGroupsMock.mockReturnValueOnce([
            {
                name: undefined,
                items: [{ name: "reports", label: "报表", href: "/admin/reports" }],
            },
        ]);

        renderShell();

        expect(screen.getByText(DEFAULT_ADMIN_MENU_GROUP)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "报表" })).toBeInTheDocument();
    });

    it("redirects after a successful logout", async () => {
        logoutMock.mockResolvedValueOnce({ redirectTo: "/login" });

        renderShell();

        const logoutButton = screen.getByRole("button", { name: /退出登录/i });
        await user.click(logoutButton);

        expect(mockPush).toHaveBeenCalledWith("/login");
        expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("reports an error when logout fails", async () => {
        logoutMock.mockRejectedValueOnce(new Error("Logout failed"));

        renderShell();

        const logoutButton = screen.getByRole("button", { name: /退出登录/i });
        await user.click(logoutButton);

        expect(mockPush).not.toHaveBeenCalled();
        expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });
});
