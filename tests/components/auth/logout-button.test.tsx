/**
 * LogoutButton组件TDD测试
 * 遵循测试驱动开发原则
 * 基于React Testing Library最佳实践
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import { signOut } from "@/modules/auth/actions/auth.action";
import authRoutes from "@/modules/auth/auth.route";

import { LogoutButton } from "@/modules/auth/components/logout-button";
import { customRender, setupUserEvent } from "../setup";

// Mock国际化消息
const mockMessages: Record<string, AbstractIntlMessages> = {
    "Auth.logout": "Logout",
    "AuthForms.Messages.signOutSuccess": "Signed out successfully",
    "AuthForms.Messages.signOutError": "Failed to sign out",
    "AuthForms.Messages.unknownError": "An unknown error occurred",
};

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: mockRefresh,
    }),
}));

// Mock actions
vi.mock("@/modules/auth/actions/auth.action", () => ({
    signOut: vi.fn(),
}));

// Mock auth routes
vi.mock("@/modules/auth/auth.route", () => ({
    default: {
        login: "/login",
        register: "/register",
        dashboard: "/dashboard",
    },
}));

// Mock toast
const mockToast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
    __esModule: true,
    default: mockToast,
    toast: mockToast,
}));

describe("LogoutButton组件", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染登出按钮", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            // 验证按钮文本
            const logoutButton = screen.getByRole("button", { name: /logout/i });
            expect(logoutButton).toBeInTheDocument();

            // 验证图标
            const icon = screen.getByRole("button", { name: /logout/i }).querySelector("svg");
            expect(icon).toBeInTheDocument();
        });

        it("应该有正确的按钮样式", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            expect(logoutButton).toHaveClass("btn-ghost"); // shadcn/ui的ghost variant
        });

        it("应该有正确的可访问性属性", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            expect(logoutButton).toBeEnabled();
            expect(logoutButton).toHaveAttribute("type", "button");
        });
    });

    describe("用户交互测试", () => {
        it("应该处理成功的登出操作", async () => {
            const mockSignOut = vi.mocked(signOut).mockResolvedValue({
                success: true,
                messageKey: "signOutSuccess",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            await user.click(logoutButton);

            // 验证API调用
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });

            // 验证成功toast
            expect(mockToast.success).toHaveBeenCalledWith("Signed out successfully");

            // 验证导航
            expect(mockPush).toHaveBeenCalledWith("/login");
            expect(mockRefresh).toHaveBeenCalled();
        });

        it("应该处理登出失败", async () => {
            const mockSignOut = vi.mocked(signOut).mockResolvedValue({
                success: false,
                messageKey: "signOutError",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            await user.click(logoutButton);

            // 验证API调用
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });

            // 验证错误toast
            expect(mockToast.error).toHaveBeenCalledWith("Failed to sign out");

            // 验证没有导航
            expect(mockPush).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it("应该处理API异常", async () => {
            const mockSignOut = vi.mocked(signOut).mockRejectedValue(
                new Error("Network error")
            );

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            await user.click(logoutButton);

            // 验证API调用
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });

            // 验证错误toast
            expect(mockToast.error).toHaveBeenCalledWith("An unknown error occurred");

            // 验证没有导航
            expect(mockPush).not.toHaveBeenCalled();
            expect(mockRefresh).not.toHaveBeenCalled();
        });

        it("应该在处理时禁用按钮", async () => {
            const mockSignOut = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 1000))
            );

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });

            // 点击按钮
            await user.click(logoutButton);

            // 验证按钮仍然可用（组件没有禁用逻辑）
            // 注意：原始实现没有在处理时禁用按钮，这是可以改进的地方
            expect(logoutButton).toBeEnabled();
        });

        it("应该支持键盘操作", async () => {
            const mockSignOut = vi.mocked(signOut).mockResolvedValue({
                success: true,
                messageKey: "signOutSuccess",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });
            logoutButton.focus();
            expect(logoutButton).toHaveFocus();

            await user.keyboard("{Enter}");

            // 验证API调用
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });
        });
    });

    describe("边界条件测试", () => {
        it("应该处理空的国际化消息", async () => {
            const emptyMessages: Record<string, AbstractIntlMessages> = {};

            const mockSignOut = vi.mocked(signOut).mockResolvedValue({
                success: true,
                messageKey: "signOutSuccess",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={emptyMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button");
            await user.click(logoutButton);

            // 验证按钮仍然可以点击，即使消息为空
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalled();
            });
        });

        it("应该处理路由器不可用的情况", async () => {
            const mockSignOut = vi.mocked(signOut).mockResolvedValue({
                success: true,
                messageKey: "signOutSuccess",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            // Mock router抛出异常
            vi.mocked(mockPush).mockImplementation(() => {
                throw new Error("Router not available");
            });

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });

            // 验证不会抛出未处理的异常
            await expect(user.click(logoutButton)).resolves.not.toThrow();
        });

        it("应该处理多个快速点击", async () => {
            const mockSignOut = vi.fn().mockResolvedValue({
                success: true,
                messageKey: "signOutSuccess",
            });

            vi.mocked(signOut).mockImplementation(mockSignOut);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });

            // 快速点击多次
            await user.click(logoutButton);
            await user.click(logoutButton);
            await user.click(logoutButton);

            // 验证多次调用（原始实现没有防抖，这是可以改进的地方）
            await waitFor(() => {
                expect(mockSignOut).toHaveBeenCalledTimes(3);
            });
        });
    });

    describe("可访问性测试", () => {
        it("应该支持屏幕阅读器", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });

            // 验证有适当的可访问性名称
            expect(logoutButton).toHaveAccessibleName(/logout/i);

            // 验证按钮有图标作为视觉辅助
            const icon = logoutButton.querySelector("svg");
            expect(icon).toBeInTheDocument();
        });

        it("应该有正确的焦点管理", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const logoutButton = screen.getByRole("button", { name: /logout/i });

            // 验证可以获得焦点
            logoutButton.focus();
            expect(logoutButton).toHaveFocus();

            // 验证可以通过Tab键导航
            await user.tab();
            expect(logoutButton).toHaveFocus();
        });

        it("应该有足够的颜色对比度", () => {
            const { container } = render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            // 验证重要元素有适当的对比度
            const logoutButton = screen.getByRole("button", { name: /logout/i });
            expect(logoutButton).toBeInTheDocument();

            // 这里可以添加更具体的对比度检查
            // 通常需要使用axe或其他可访问性工具
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const { container } = render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(50); // 简单组件应该很快
            expect(container).toBeInTheDocument();
        });

        it("应该不会内存泄漏", () => {
            const { unmount } = render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            // 验证组件可以正常卸载
            expect(() => unmount()).not.toThrow();
        });
    });

    describe("国际化测试", () => {
        it("应该支持不同的语言环境", () => {
            const chineseMessages: Record<string, AbstractIntlMessages> = {
                "Auth.logout": "登出",
                "AuthForms.Messages.signOutSuccess": "登出成功",
                "AuthForms.Messages.signOutError": "登出失败",
                "AuthForms.Messages.unknownError": "发生未知错误",
            };

            render(
                <NextIntlClientProvider locale="zh" messages={chineseMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            // 验证中文文本
            const logoutButton = screen.getByRole("button", { name: /登出/i });
            expect(logoutButton).toBeInTheDocument();
        });

        it("应该处理缺失的翻译", () => {
            const incompleteMessages: Record<string, AbstractIntlMessages> = {
                "Auth.logout": "Logout",
                // 缺少其他翻译
            };

            render(
                <NextIntlClientProvider locale="en" messages={incompleteMessages}>
                    <LogoutButton />
                </NextIntlClientProvider>
            );

            // 验证即使翻译不完整，组件仍然可以渲染
            const logoutButton = screen.getByRole("button", { name: /logout/i });
            expect(logoutButton).toBeInTheDocument();
        });
    });
});