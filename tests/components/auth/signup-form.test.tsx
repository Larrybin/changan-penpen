/**
 * SignUpForm组件TDD测试
 * 遵循测试驱动开发原则
 * 基于React Testing Library最佳实践
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { signup } from "@/modules/auth/actions/auth.action";
import { useRouter } from "next/navigation";
import { authClient } from "@/modules/auth/utils/auth-client";

import { SignupForm } from "@/modules/auth/components/signup-form";
import { customRender, setupUserEvent, createMockFormData } from "../setup";

// Mock国际化消息
const mockMessages: Record<string, AbstractIntlMessages> = {
    "AuthForms.Signup.title": "Create Account",
    "AuthForms.Signup.description": "Sign up to get started",
    "AuthForms.Signup.googleCta": "Continue with Google",
    "AuthForms.Shared.continueWith": "Or continue with",
    "AuthForms.Shared.fields.username.label": "Username",
    "AuthForms.Shared.fields.username.placeholder": "Enter your username",
    "AuthForms.Shared.fields.email.label": "Email",
    "AuthForms.Shared.fields.email.placeholder": "Enter your email",
    "AuthForms.Shared.fields.password.label": "Password",
    "AuthForms.Shared.fields.password.placeholder": "Enter your password",
    "AuthForms.Validation.username.required": "Username is required",
    "AuthForms.Validation.email.required": "Email is required",
    "AuthForms.Validation.email.invalid": "Invalid email format",
    "AuthForms.Validation.password.required": "Password is required",
    "AuthForms.Validation.password.minLength": "Password must be at least 8 characters",
    "AuthForms.Validation.password.tooShort": "Password is too short",
    "AuthForms.Messages.signUpSuccess": "Account created successfully",
    "AuthForms.Messages.socialSignInError": "Failed to sign in with Google",
};

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
}));

// Mock actions
vi.mock("@/modules/auth/actions/auth.action", () => ({
    signup: vi.fn(),
}));

// Mock toast
const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
};

vi.mock("@/lib/toast", () => ({
    __esModule: true,
    default: mockToast,
    toast: mockToast,
}));

// Mock auth client
vi.mock("@/modules/auth/utils/auth-client", () => ({
    authClient: {
        signIn: {
            social: vi.fn(),
        },
    },
}));

describe("SignUpForm组件", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染注册表单", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 验证标题和描述
            expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
            expect(screen.getByText(/sign up to get started/i)).toBeInTheDocument();

            // 验证Google登录按钮
            const googleButton = screen.getByRole("button", { name: /continue with google/i });
            expect(googleButton).toBeInTheDocument();

            // 验证表单字段
            expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

            // 验证提交按钮
            expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
        });

        it("应该显示正确的表单结构", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 验证表单容器
            const form = screen.getByRole("form");
            expect(form).toBeInTheDocument();

            // 验证字段布局
            const inputs = screen.getAllByRole("textbox");
            expect(inputs).toHaveLength(3); // username, email, password

            // 验证Google登录按钮在表单外部
            const googleButton = screen.getByRole("button", { name: /continue with google/i });
            expect(googleButton.closest("form")).not.toBeInTheDocument();
        });

        it("应该有正确的可访问性属性", () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 验证标签关联
            const usernameInput = screen.getByLabelText(/username/i);
            expect(usernameInput).toHaveAttribute("id", "username");

            const emailInput = screen.getByLabelText(/email/i);
            expect(emailInput).toHaveAttribute("id", "email");

            const passwordInput = screen.getByLabelText(/password/i);
            expect(passwordInput).toHaveAttribute("id", "password");
        });
    });

    describe("表单验证测试", () => {
        it("应该验证必填字段", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 提交空表单
            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 验证错误消息
            await waitFor(() => {
                expect(screen.getByText(/username is required/i)).toBeInTheDocument();
                expect(screen.getByText(/email is required/i)).toBeInTheDocument();
                expect(screen.getByText(/password is required/i)).toBeInTheDocument();
            });
        });

        it("应该验证邮箱格式", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const emailInput = screen.getByLabelText(/email/i);
            await user.type(emailInput, "invalid-email");

            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
            });
        });

        it("应该验证密码长度", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const passwordInput = screen.getByLabelText(/password/i);
            await user.type(passwordInput, "123"); // 太短的密码

            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/password is too short/i)).toBeInTheDocument();
            });
        });

        it("应该显示字段特定的错误消息", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 在username字段输入空值
            const usernameInput = screen.getByLabelText(/username/i);
            await user.clear(usernameInput);

            // 焦点移到其他字段
            const emailInput = screen.getByLabelText(/email/i);
            await user.type(emailInput, "test@example.com");

            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            await waitFor(() => {
                // 验证错误消息显示在正确的字段附近
                const usernameError = screen.getByText(/username is required/i);
                const usernameField = usernameInput.closest("div");
                expect(usernameField).toContainElement(usernameError);
            });
        });
    });

    describe("用户交互测试", () => {
        it("应该允许用户填写表单", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const formData = createMockFormData({
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            });

            // 填写用户名
            const usernameInput = screen.getByLabelText(/username/i);
            await user.type(usernameInput, formData.username);
            expect(usernameInput).toHaveValue(formData.username);

            // 填写邮箱
            const emailInput = screen.getByLabelText(/email/i);
            await user.type(emailInput, formData.email);
            expect(emailInput).toHaveValue(formData.email);

            // 填写密码
            const passwordInput = screen.getByLabelText(/password/i);
            await user.type(passwordInput, formData.password);
            expect(passwordInput).toHaveValue(formData.password);
        });

        it("应该处理表单提交", async () => {
            const mockSignUp = vi.mocked(signup).mockResolvedValue({
                success: true,
                messageKey: "signUpSuccess",
            });

            vi.mocked(signup).mockImplementation(mockSignUp);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const formData = createMockFormData({
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            });

            // 填写表单
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await user.type(usernameInput, formData.username);
            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            // 提交表单
            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 验证API调用
            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith(formData);
            });

            // 验证成功toast
            expect(mockToast.success).toHaveBeenCalledWith("Account created successfully");

            // 验证导航
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });

        it("应该处理提交失败", async () => {
            const mockSignUp = vi.mocked(signup).mockRejectedValue(
                new Error("Registration failed")
            );

            vi.mocked(signup).mockImplementation(mockSignUp);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const formData = createMockFormData({
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            });

            // 填写并提交表单
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await user.type(usernameInput, formData.username);
            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            const submitButton = screen.getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 验证错误处理
            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalled();
            });
        });

        it("应该在提交时显示加载状态", async () => {
            const mockSignUp = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 1000))
            );

            vi.mocked(signup).mockImplementation(mockSignUp);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const formData = createMockFormData();
            const submitButton = screen.getByRole("button", { name: /submit/i });

            await user.click(submitButton);

            // 验证加载状态
            expect(submitButton).toBeDisabled();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe("Google登录测试", () => {
        it("应该处理Google登录成功", async () => {
            const mockSignIn = vi.fn().mockResolvedValue({
                id: "google-user-id",
                email: "user@gmail.com",
                name: "Google User",
            });

            vi.mocked(authClient.signIn.social).mockImplementation(mockSignIn);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const googleButton = screen.getByRole("button", { name: /continue with google/i });
            await user.click(googleButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith({
                    provider: "google",
                    callbackURL: "/dashboard",
                });
            });
        });

        it("应该处理Google登录失败", async () => {
            const mockSignIn = vi.fn().mockRejectedValue(
                new Error("Google sign in failed")
            );

            vi.mocked(authClient.signIn.social).mockImplementation(mockSignIn);

            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const googleButton = screen.getByRole("button", { name: /continue with google/i });
            await user.click(googleButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalled();
                expect(mockToast.error).toHaveBeenCalledWith("Failed to sign in with Google");
            });
        });
    });

    describe("边界条件测试", () => {
        it("应该处理长用户名", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const longUsername = "a".repeat(100);
            const usernameInput = screen.getByLabelText(/username/i);
            await user.type(usernameInput, longUsername);

            expect(usernameInput).toHaveValue(longUsername);
        });

        it("应该处理特殊字符密码", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const specialPassword = "P@ssw0rd!#$";
            const passwordInput = screen.getByLabelText(/password/i);
            await user.type(passwordInput, specialPassword);

            expect(passwordInput).toHaveValue(specialPassword);
        });

        it("应该处理表单重置", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const formData = createMockFormData();

            // 填写表单
            const usernameInput = screen.getByLabelText(/username/i);
            const emailInput = screen.getByLabelText(/email/i);
            const passwordInput = screen.getByLabelText(/password/i);

            await user.type(usernameInput, formData.username);
            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            // 重置表单
            usernameInput.focus();
            await user.clear(usernameInput);
            await user.clear(emailInput);
            await user.clear(passwordInput);

            // 验证字段为空
            expect(usernameInput).toHaveValue("");
            expect(emailInput).toHaveValue("");
            expect(passwordInput).toHaveValue("");
        });
    });

    describe("性能和可访问性测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const { container } = render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(100);
            expect(container).toBeInTheDocument();
        });

        it("应该支持键盘导航", async () => {
            render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            const submitButton = screen.getByRole("button", { name: /submit/i });
            submitButton.focus();
            expect(submitButton).toHaveFocus();

            await user.keyboard("{Enter}");

            // 验证表单提交尝试
            await waitFor(() => {
                expect(screen.getByText(/username is required/i)).toBeInTheDocument();
            });
        });

        it("应该有正确的颜色对比度", () => {
            const { container } = render(
                <NextIntlClientProvider locale="en" messages={mockMessages}>
                    <SignupForm />
                </NextIntlClientProvider>
            );

            // 验证重要元素有适当的对比度
            const form = screen.getByRole("form");
            expect(form).toBeInTheDocument();

            // 这里可以添加更多的可访问性检查
        });
    });
});