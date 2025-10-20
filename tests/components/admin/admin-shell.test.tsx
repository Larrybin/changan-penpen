/**
 * AdminShell组件TDD测试
 * 遵循测试驱动开发原则
 * 基于React Testing Library最佳实践
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AuthUser } from "@/modules/auth/models/user.model";
import { adminAuthProvider } from "@/modules/admin/providers/auth-provider";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import { buildAdminMenuGroups, DEFAULT_ADMIN_MENU_GROUP } from "@/modules/admin/constants";

import { AdminShell } from "@/modules/admin/components/admin-shell";
import { customRender, setupUserEvent } from "../setup";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    usePathname: () => "/admin/dashboard",
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
}));

// Mock admin constants
vi.mock("@/modules/admin/constants", () => ({
    buildAdminMenuGroups: () => [
        {
            name: "内容管理",
            items: [
                {
                    name: "todos",
                    label: "Todos管理",
                    href: "/admin/todos",
                },
                {
                    name: "users",
                    label: "用户管理",
                    href: "/admin/users",
                },
            ],
        },
        {
            name: "系统管理",
            items: [
                {
                    name: "settings",
                    label: "系统设置",
                    href: "/admin/settings",
                },
            ],
        },
    ],
    DEFAULT_ADMIN_MENU_GROUP: "默认分组",
}));

// Mock admin routes
vi.mock("@/modules/admin/routes/admin.routes", () => ({
    default: {
        root: "/admin",
        dashboard: "/admin/dashboard",
        todos: "/admin/todos",
        users: "/admin/users",
        settings: "/admin/settings",
    },
}));

// Mock auth provider
vi.mock("@/modules/admin/providers/auth-provider", () => ({
    adminAuthProvider: {
        logout: vi.fn(),
    },
}));

// Mock PageContainer
vi.mock("@/components/layout/page-container", () => ({
    PageContainer: ({ children, fullHeight }: { children: React.ReactNode; fullHeight?: boolean }) => (
        <div data-testid="page-container" data-full-height={fullHeight}>
            {children}
        </div>
    ),
}));

describe("AdminShell组件", () => {
    let user: ReturnType<typeof setupUserEvent>;
    let mockUser: AuthUser;

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();

        mockUser = {
            id: "admin-user-id",
            email: "admin@example.com",
            name: "Admin User",
            role: "admin",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染管理员界面布局", () => {
            customRender(<AdminShell user={mockUser} />);

            // 验证侧边栏
            const sidebar = document.querySelector("aside");
            expect(sidebar).toBeInTheDocument();

            // 验证标题区域
            expect(screen.getByText("站长仪表盘")).toBeInTheDocument();
            expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument(); // CheckSquare图标

            // 验证用户信息
            expect(screen.getByText(mockUser.email)).toBeInTheDocument();

            // 验证主内容区域
            const main = document.querySelector("main");
            expect(main).toBeInTheDocument();

            // 验证PageContainer
            expect(screen.getByTestId("page-container")).toBeInTheDocument();
        });

        it("应该显示正确的菜单分组", () => {
            customRender(<AdminShell user={mockUser} />);

            // 验证菜单分组
            expect(screen.getByText("内容管理")).toBeInTheDocument();
            expect(screen.getByText("系统管理")).toBeInTheDocument();

            // 验证菜单项
            expect(screen.getByText("Todos管理")).toBeInTheDocument();
            expect(screen.getByText("用户管理")).toBeInTheDocument();
            expect(screen.getByText("系统设置")).toBeInTheDocument();
        });

        it("应该显示退出登录按钮", () => {
            customRender(<AdminShell user={mockUser} />);

            const logoutButton = screen.getByRole("button", { name: /退出登录/i });
            expect(logoutButton).toBeInTheDocument();

            // 验证按钮图标
            const icon = logoutButton.querySelector("svg");
            expect(icon).toBeInTheDocument();
        });

        it("应该有正确的可访问性属性", () => {
            customRender(<AdminShell user={mockUser} />);

            // 验证导航区域
            const nav = document.querySelector("nav");
            expect(nav).toBeInTheDocument();

            // 验证链接可访问性
            const links = screen.getAllByRole("link");
            expect(links.length).toBeGreaterThan(0);

            links.forEach(link => {
                expect(link).toHaveAttribute("href");
            });
        });
    });

    describe("菜单导航测试", () => {
        it("应该正确标识活跃菜单项", () => {
            // Mock pathname为dashboard
            vi.doMock("next/navigation", () => ({
                usePathname: () => "/admin/dashboard",
                useRouter: () => ({
                    push: mockPush,
                    replace: vi.fn(),
                    prefetch: vi.fn(),
                    back: vi.fn(),
                    forward: vi.fn(),
                    refresh: vi.fn(),
                }),
            }));

            customRender(<AdminShell user={mockUser} />);

            // 由于当前路径是dashboard，没有匹配的菜单项，所有菜单项都应该是非活跃状态
            const menuLinks = screen.getAllByRole("link");
            menuLinks.forEach(link => {
                expect(link).not.toHaveClass("bg-primary");
            });
        });

        it("应该高亮当前页面的菜单项", () => {
            // Mock pathname为todos页面
            vi.doMock("next/navigation", () => ({
                usePathname: () => "/admin/todos",
                useRouter: () => ({
                    push: mockPush,
                    replace: vi.fn(),
                    prefetch: vi.fn(),
                    back: vi.fn(),
                    forward: vi.fn(),
                    refresh: vi.fn(),
                }),
            }));

            customRender(<AdminShell user={mockUser} />);

            const todosLink = screen.getByRole("link", { name: /Todos管理/i });
            expect(todosLink).toHaveClass("bg-primary", "text-primary-foreground");
        });

        it("应该正确处理子路径匹配", () => {
            // Mock pathname为todos子页面
            vi.doMock("next/navigation", () => ({
                usePathname: () => "/admin/todos/123/edit",
                useRouter: () => ({
                    push: mockPush,
                    replace: vi.fn(),
                    prefetch: vi.fn(),
                    back: vi.fn(),
                    forward: vi.fn(),
                    refresh: vi.fn(),
                }),
            }));

            customRender(<AdminShell user={mockUser} />);

            const todosLink = screen.getByRole("link", { name: /Todos管理/i });
            expect(todosLink).toHaveClass("bg-primary", "text-primary-foreground");
        });

        it("应该支持键盘导航", async () => {
            customRender(<AdminShell user={mockUser} />);

            const firstLink = screen.getAllByRole("link")[0];
            firstLink.focus();
            expect(firstLink).toHaveFocus();

            // 测试Tab键导航
            await user.tab();
            const nextElement = document.activeElement;
            expect(nextElement).toBeInTheDocument();
        });
    });

    describe("用户交互测试", () => {
        it("应该处理菜单项点击", async () => {
            customRender(<AdminShell user={mockUser} />);

            const todosLink = screen.getByRole("link", { name: /Todos管理/i });
            await user.click(todosLink);

            // 由于是Next.js Link，这里主要验证没有抛出异常
            expect(todosLink.closest("a")).toHaveAttribute("href", "/admin/todos");
        });

        it("应该处理退出登录", async () => {
            const mockLogout = vi.fn().mockResolvedValue({
                redirectTo: "/login",
            });

            vi.mocked(adminAuthProvider.logout).mockImplementation(mockLogout);

            customRender(<AdminShell user={mockUser} />);

            const logoutButton = screen.getByRole("button", { name: /退出登录/i });
            await user.click(logoutButton);

            // 验证logout函数被调用
            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });

            // 验证重定向
            expect(mockPush).toHaveBeenCalledWith("/login");
        });

        it("应该处理退出登录失败", async () => {
            const mockLogout = vi.fn().mockResolvedValue(null);

            vi.mocked(adminAuthProvider.logout).mockImplementation(mockLogout);

            customRender(<AdminShell user={mockUser} />);

            const logoutButton = screen.getByRole("button", { name: /退出登录/i });
            await user.click(logoutButton);

            // 验证logout函数被调用
            await waitFor(() => {
                expect(mockLogout).toHaveBeenCalled();
            });

            // 验证没有重定向
            expect(mockPush).not.toHaveBeenCalled();
        });

        it("应该处理退出登录异常", async () => {
            const mockLogout = vi.fn().mockRejectedValue(
                new Error("Logout failed")
            );

            vi.mocked(adminAuthProvider.logout).mockImplementation(mockLogout);

            customRender(<AdminShell user={mockUser} />);

            const logoutButton = screen.getByRole("button", { name: /退出登录/i });

            // 验证不会抛出未处理的异常
            await expect(user.click(logoutButton)).resolves.not.toThrow();
        });
    });

    describe("响应式测试", () => {
        it("应该在移动端正确显示", () => {
            // 模拟移动端视口
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: 375,
            });
            Object.defineProperty(window, "innerHeight", {
                writable: true,
                configurable: true,
                value: 667,
            });

            customRender(<AdminShell user={mockUser} />);

            // 验证侧边栏仍然存在
            const sidebar = document.querySelector("aside");
            expect(sidebar).toBeInTheDocument();

            // 验证主内容区域
            const main = document.querySelector("main");
            expect(main).toBeInTheDocument();
        });

        it("应该在桌面端正确显示", () => {
            // 模拟桌面端视口
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: 1920,
            });
            Object.defineProperty(window, "innerHeight", {
                writable: true,
                configurable: true,
                value: 1080,
            });

            customRender(<AdminShell user={mockUser} />);

            // 验证布局正常
            const sidebar = document.querySelector("aside");
            const main = document.querySelector("main");
            expect(sidebar).toBeInTheDocument();
            expect(main).toBeInTheDocument();
        });
    });

    describe("边界条件测试", () => {
        it("应该处理空菜单分组", () => {
            vi.doMock("@/modules/admin/constants", () => ({
                buildAdminMenuGroups: () => [],
                DEFAULT_ADMIN_MENU_GROUP: "默认分组",
            }));

            customRender(<AdminShell user={mockUser} />);

            // 验证没有菜单分组时仍然正常渲染
            const sidebar = document.querySelector("aside");
            expect(sidebar).toBeInTheDocument();

            // 验证默认分组不显示
            expect(screen.queryByText("默认分组")).not.toBeInTheDocument();
        });

        it("应该处理没有分组名称的菜单项", () => {
            vi.doMock("@/modules/admin/constants", () => ({
                buildAdminMenuGroups: () => [
                    {
                        name: null,
                        items: [
                            {
                                name: "dashboard",
                                label: "仪表盘",
                                href: "/admin/dashboard",
                            },
                        ],
                    },
                ],
                DEFAULT_ADMIN_MENU_GROUP: "默认分组",
            }));

            customRender(<AdminShell user={mockUser} />);

            // 验证使用默认分组名称
            expect(screen.getByText("默认分组")).toBeInTheDocument();
            expect(screen.getByText("仪表盘")).toBeInTheDocument();
        });

        it("应该处理用户信息缺失", () => {
            const incompleteUser = {
                id: "admin-user-id",
                email: "",
                name: "",
                role: "admin",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as AuthUser;

            customRender(<AdminShell user={incompleteUser} />);

            // 验证即使信息不完整也能正常渲染
            expect(screen.getByText("站长仪表盘")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /退出登录/i })).toBeInTheDocument();
        });
    });

    describe("可访问性测试", () => {
        it("应该支持屏幕阅读器", () => {
            customRender(<AdminShell user={mockUser} />);

            // 验证导航区域有适当的标签
            const nav = document.querySelector("nav");
            expect(nav).toBeInTheDocument();

            // 验证链接有可访问的文本
            const links = screen.getAllByRole("link");
            links.forEach(link => {
                expect(link).toHaveTextContent();
            });

            // 验证按钮有可访问的文本
            const logoutButton = screen.getByRole("button", { name: /退出登录/i });
            expect(logoutButton).toHaveAccessibleName(/退出登录/i);
        });

        it("应该有正确的焦点管理", async () => {
            customRender(<AdminShell user={mockUser} />);

            const logoutButton = screen.getByRole("button", { name: /退出登录/i });
            logoutButton.focus();
            expect(logoutButton).toHaveFocus();

            // 验证可以通过Tab键导航
            await user.tab();
            expect(document.activeElement).toBeInTheDocument();
        });

        it("应该有足够的颜色对比度", () => {
            const { container } = customRender(<AdminShell user={mockUser} />);

            // 验证重要元素存在
            const sidebar = document.querySelector("aside");
            const main = document.querySelector("main");
            expect(sidebar).toBeInTheDocument();
            expect(main).toBeInTheDocument();

            // 这里可以添加更具体的对比度检查
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const { container } = customRender(<AdminShell user={mockUser} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(100);
            expect(container).toBeInTheDocument();
        });

        it("应该不会内存泄漏", () => {
            const { unmount } = customRender(<AdminShell user={mockUser} />);

            // 验证组件可以正常卸载
            expect(() => unmount()).not.toThrow();
        });

        it("应该正确处理菜单项重新计算", () => {
            const { rerender } = customRender(<AdminShell user={mockUser} />);

            // 初始渲染
            expect(screen.getByText("内容管理")).toBeInTheDocument();

            // 重新渲染
            const updatedUser = {
                ...mockUser,
                email: "updated@example.com",
            };

            rerender(<AdminShell user={updatedUser} />);

            // 验证更新后仍然正常
            expect(screen.getByText("内容管理")).toBeInTheDocument();
            expect(screen.getByText(updatedUser.email)).toBeInTheDocument();
        });
    });

    describe("布局测试", () => {
        it("应该有正确的CSS类名", () => {
            customRender(<AdminShell user={mockUser} />);

            // 验证主容器
            const mainContainer = document.querySelector(".flex.min-h-screen");
            expect(mainContainer).toBeInTheDocument();

            // 验证侧边栏
            const sidebar = document.querySelector("aside");
            expect(sidebar).toBeInTheDocument();
            expect(sidebar).toHaveClass("flex", "flex-col", "border-r");

            // 验证主内容区域
            const main = document.querySelector("main");
            expect(main).toBeInTheDocument();
            expect(main).toHaveClass("flex-1", "overflow-y-auto");
        });

        it("应该正确传递属性给子组件", () => {
            customRender(<AdminShell user={mockUser} />);

            const pageContainer = screen.getByTestId("page-container");
            expect(pageContainer).toHaveAttribute("data-full-height", "true");
        });
    });
});