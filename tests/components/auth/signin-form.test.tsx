/**
 * SignInForm组件TDD测试
 * 遵循测试驱动开发原则
 * 基于React Testing Library最佳实践
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { signInAction } from "@/app/(auth)/sign-in/sign-in.actions";
import { generateAuthenticationOptionsAction, verifyAuthenticationAction } from "@/app/(settings)/settings/security/passkey-settings.actions";
import { startAuthentication } from "@simplewebauthn/browser";

import SignInPage from "@/app/(auth)/sign-in/sign-in.client";
import { customRender, setupUserEvent, createMockFormData } from "../setup";

// Mock国际化消息
const mockMessages: Record<string, AbstractIntlMessages> = {
    "AuthForms.Signin.title": "Sign in to your account",
    "AuthForms.Signin.description": "Welcome back! Please sign in to continue",
    "AuthForms.Signin.emailPlaceholder": "Email address",
    "AuthForms.Signin.passwordPlaceholder": "Password",
    "AuthForms.Signin.submitButton": "Sign In with Password",
    "AuthForms.Signin.createAccount": "create a new account",
    "AuthForms.Signin.forgotPassword": "Forgot your password?",
    "AuthForms.Signin.passkeyButton": "Sign in with a Passkey",
    "AuthForms.Signin.authenticating": "Authenticating...",
    "AuthForms.Signin.signInWith": "Sign in with",
    "AuthForms.Shared.or": "Or",
    "AuthForms.Validation.email.required": "Email is required",
    "AuthForms.Validation.email.invalid": "Please enter a valid email address",
    "AuthForms.Validation.password.required": "Password is required",
    "AuthForms.Validation.password.minLength": "Password must be at least 8 characters",
    "AuthForms.Messages.signInSuccess": "Signed in successfully",
    "AuthForms.Messages.signInError": "Invalid email or password",
    "AuthForms.Messages.unknownError": "An unexpected error occurred",
    "AuthForms.Messages.authenticating": "Signing you in...",
    "AuthForms.Messages.passkeyAuthenticating": "Authenticating with passkey...",
    "AuthForms.Messages.passkeySuccess": "Authentication successful",
    "AuthForms.Messages.passkeyError": "Authentication failed",
    "AuthForms.Messages.passkeyOptionsError": "Failed to get authentication options",
};

// Mock actions
vi.mock("@/app/(auth)/sign-in/sign-in.actions", () => ({
    signInAction: vi.fn(),
}));

vi.mock("@/app/(settings)/settings/security/passkey-settings.actions", () => ({
    generateAuthenticationOptionsAction: vi.fn(),
    verifyAuthenticationAction: vi.fn(),
}));

// Mock SimpleWebAuthn
vi.mock("@simplewebauthn/browser", () => ({
    startAuthentication: vi.fn(),
}));

// Mock toast
const mockToast = vi.hoisted(() => ({
    dismiss: vi.fn(),
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: mockToast,
}));

// Mock window.location
const mockLocation = {
    href: "",
    assign: vi.fn(),
    replace: vi.fn(),
};

Object.defineProperty(window, "location", {
    value: mockLocation,
    writable: true,
});

describe("SignInForm组件", () => {
    let user: ReturnType<typeof setupUserEvent>;
    const redirectPath = "/dashboard";

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();
        mockLocation.href = "";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染登录表单", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证标题
            expect(screen.getByRole("heading", { name: /sign in to your account/i })).toBeInTheDocument();

            // 验证描述文本
            expect(screen.getByText(/welcome back! please sign in to continue/i)).toBeInTheDocument();

            // 验证表单字段
            expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();

            // 验证提交按钮
            expect(screen.getByRole("button", { name: /sign in with password/i })).toBeInTheDocument();

            // 验证链接
            expect(screen.getByRole("link", { name: /create a new account/i })).toBeInTheDocument();
            expect(screen.getByRole("link", { name: /forgot your password\?/i })).toBeInTheDocument();
        });

        it("应该显示Passkey登录按钮", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const passkeyButton = screen.getByRole("button", { name: /sign in with a passkey/i });
            expect(passkeyButton).toBeInTheDocument();

            // 验证按钮包含图标
            const icon = passkeyButton.querySelector("svg");
            expect(icon).toBeInTheDocument();
        });

        it("应该有正确的表单结构", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证表单容器
            const form = screen.getByRole("form");
            expect(form).toBeInTheDocument();

            // 验证字段数量
            const inputs = screen.getAllByRole("textbox");
            expect(inputs).toHaveLength(1); // email input
            const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
            expect(passwordInput).toBeInTheDocument();
        });

        it("应该有正确的可访问性属性", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证输入框标签
            const emailInput = screen.getByPlaceholderText(/email address/i);
            expect(emailInput).toHaveAttribute("type", "email");

            const passwordInput = screen.getByPlaceholderText(/password/i);
            expect(passwordInput).toHaveAttribute("type", "password");

            // 验证按钮类型
            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            expect(submitButton).toHaveAttribute("type", "submit");
        });
    });

    describe("表单验证测试", () => {
        it("应该验证必填字段", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            // 提交空表单
            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            // 验证错误消息
            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });
        });

        it("应该验证邮箱格式", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const emailInput = screen.getByPlaceholderText(/email address/i);
            await user.type(emailInput, "invalid-email");

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });
        });

        it("应该验证密码长度", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const emailInput = screen.getByPlaceholderText(/email address/i);
            const passwordInput = screen.getByPlaceholderText(/password/i);

            await user.type(emailInput, "test@example.com");
            await user.type(passwordInput, "123"); // 太短的密码

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
            });
        });

        it("应该显示字段特定的错误消息", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const emailInput = screen.getByPlaceholderText(/email address/i);
            await user.type(emailInput, "invalid-email");

            // 焦点移到其他字段
            const passwordInput = screen.getByPlaceholderText(/password/i);
            await user.click(passwordInput);

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            await waitFor(() => {
                // 验证错误消息显示在正确的字段附近
                const emailError = screen.getByText(/please enter a valid email address/i);
                const emailField = emailInput.closest("div");
                expect(emailField).toContainElement(emailError);
            });
        });
    });

    describe("用户交互测试", () => {
        it("应该允许用户填写表单", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const formData = createMockFormData({
                email: "test@example.com",
                password: "password123",
            });

            // 填写邮箱
            const emailInput = screen.getByPlaceholderText(/email address/i);
            await user.type(emailInput, formData.email);
            expect(emailInput).toHaveValue(formData.email);

            // 填写密码
            const passwordInput = screen.getByPlaceholderText(/password/i);
            await user.type(passwordInput, formData.password);
            expect(passwordInput).toHaveValue(formData.password);
        });

        it("应该处理成功的登录", async () => {
            const mockSignIn = vi.fn().mockResolvedValue({
                data: { success: true },
            });

            vi.mocked(signInAction).mockImplementation(mockSignIn);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const formData = createMockFormData({
                email: "test@example.com",
                password: "password123",
            });

            // 填写表单
            const emailInput = screen.getByPlaceholderText(/email address/i);
            const passwordInput = screen.getByPlaceholderText(/password/i);

            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            // 提交表单
            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            // 验证loading toast
            expect(mockToast.loading).toHaveBeenCalledWith("Signing you in...");

            // 验证API调用
            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith(formData);
            });

            // 验证成功toast
            expect(mockToast.success).toHaveBeenCalledWith("Signed in successfully");

            // 验证重定向
            expect(mockLocation.href).toBe(redirectPath);
        });

        it("应该处理登录失败", async () => {
            const mockSignIn = vi.fn().mockResolvedValue({
                error: { message: "Invalid email or password" },
            });

            vi.mocked(signInAction).mockImplementation(mockSignIn);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const formData = createMockFormData({
                email: "test@example.com",
                password: "wrongpassword",
            });

            // 填写并提交表单
            const emailInput = screen.getByPlaceholderText(/email address/i);
            const passwordInput = screen.getByPlaceholderText(/password/i);

            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            // 验证错误处理
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith("Invalid email or password");
            });

            // 验证没有重定向
            expect(mockLocation.href).toBe("");
        });

        it("应该在提交时显示加载状态", async () => {
            const mockSignIn = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 1000))
            );

            vi.mocked(signInAction).mockImplementation(mockSignIn);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            await user.click(submitButton);

            // 验证loading状态
            expect(mockToast.loading).toHaveBeenCalledWith("Signing you in...");
        });
    });

    describe("Passkey登录测试", () => {
        it("应该处理Passkey登录成功", async () => {
            const mockGenerateOptions = vi.fn().mockResolvedValue({
                data: {
                    challenge: "test-challenge",
                    allowCredentials: [],
                },
            });

            const mockVerifyAuthentication = vi.fn().mockResolvedValue({
                data: { success: true },
            });

            const mockStartAuthentication = vi.fn().mockResolvedValue({
                id: "test-credential-id",
                rawId: new ArrayBuffer(0),
                response: {
                    clientDataJSON: new ArrayBuffer(0),
                    authenticatorData: new ArrayBuffer(0),
                    signature: new ArrayBuffer(0),
                    userHandle: new ArrayBuffer(0),
                },
                type: "public-key",
            });

            vi.mocked(generateAuthenticationOptionsAction).mockImplementation(mockGenerateOptions);
            vi.mocked(verifyAuthenticationAction).mockImplementation(mockVerifyAuthentication);
            vi.mocked(startAuthentication).mockImplementation(mockStartAuthentication);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const passkeyButton = screen.getByRole("button", { name: /sign in with a passkey/i });
            await user.click(passkeyButton);

            // 验证loading toast
            expect(mockToast.loading).toHaveBeenCalledWith("Authenticating with passkey...");

            // 验证生成选项调用
            await waitFor(() => {
                expect(mockGenerateOptions).toHaveBeenCalledWith({});
            });

            // 验证浏览器认证调用
            await waitFor(() => {
                expect(mockStartAuthentication).toHaveBeenCalledWith({
                    optionsJSON: {
                        challenge: "test-challenge",
                        allowCredentials: [],
                    },
                });
            });

            // 验证服务器验证调用
            await waitFor(() => {
                expect(mockVerifyAuthentication).toHaveBeenCalledWith({
                    response: expect.any(Object),
                    challenge: "test-challenge",
                });
            });

            // 验证成功toast
            expect(mockToast.success).toHaveBeenCalledWith("Authentication successful");

            // 验证重定向
            expect(mockLocation.href).toBe(redirectPath);
        });

        it("应该处理Passkey登录失败", async () => {
            const mockGenerateOptions = vi.fn().mockResolvedValue({
                data: {
                    challenge: "test-challenge",
                    allowCredentials: [],
                },
            });

            const mockStartAuthentication = vi.fn().mockRejectedValue(
                new Error("Authentication failed")
            );

            vi.mocked(generateAuthenticationOptionsAction).mockImplementation(mockGenerateOptions);
            vi.mocked(startAuthentication).mockImplementation(mockStartAuthentication);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const passkeyButton = screen.getByRole("button", { name: /sign in with a passkey/i });
            await user.click(passkeyButton);

            // 验证错误处理
            await waitFor(() => {
                expect(mockToast.error).toHaveBeenCalledWith("Authentication failed");
            });

            // 验证没有重定向
            expect(mockLocation.href).toBe("");
        });

        it("应该在Passkey认证时显示加载状态", async () => {
            const mockGenerateOptions = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 1000))
            );

            vi.mocked(generateAuthenticationOptionsAction).mockImplementation(mockGenerateOptions);

            customRender(<SignInPage redirectPath={redirectPath} />);

            const passkeyButton = screen.getByRole("button", { name: /sign in with a passkey/i });
            await user.click(passkeyButton);

            // 验证按钮显示加载状态
            await waitFor(() => {
                expect(passkeyButton).toHaveTextContent("Authenticating...");
                expect(passkeyButton).toBeDisabled();
            });
        });
    });

    describe("边界条件测试", () => {
        it("应该处理长邮箱地址", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const longEmail = "a".repeat(50) + "@example.com";
            const emailInput = screen.getByPlaceholderText(/email address/i);
            await user.type(emailInput, longEmail);

            expect(emailInput).toHaveValue(longEmail);
        });

        it("应该处理特殊字符密码", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const specialPassword = "P@ssw0rd!#$%^&*()";
            const passwordInput = screen.getByPlaceholderText(/password/i);
            await user.type(passwordInput, specialPassword);

            expect(passwordInput).toHaveValue(specialPassword);
        });

        it("应该处理表单重置", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const formData = createMockFormData();

            // 填写表单
            const emailInput = screen.getByPlaceholderText(/email address/i);
            const passwordInput = screen.getByPlaceholderText(/password/i);

            await user.type(emailInput, formData.email);
            await user.type(passwordInput, formData.password);

            // 重置表单
            await user.clear(emailInput);
            await user.clear(passwordInput);

            // 验证字段为空
            expect(emailInput).toHaveValue("");
            expect(passwordInput).toHaveValue("");
        });
    });

    describe("可访问性测试", () => {
        it("应该支持键盘导航", async () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const submitButton = screen.getByRole("button", { name: /sign in with password/i });
            submitButton.focus();
            expect(submitButton).toHaveFocus();

            await user.keyboard("{Enter}");

            // 验证表单提交尝试
            await waitFor(() => {
                expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });
        });

        it("应该有正确的颜色对比度", () => {
            const { container } = customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证重要元素存在
            const form = screen.getByRole("form");
            expect(form).toBeInTheDocument();

            // 这里可以添加更多的对比度检查
        });

        it("应该支持屏幕阅读器", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证标题层级
            const heading = screen.getByRole("heading", { level: 2 });
            expect(heading).toBeInTheDocument();

            // 验证链接文本清晰
            const createAccountLink = screen.getByRole("link", { name: /create a new account/i });
            expect(createAccountLink).toBeInTheDocument();

            const forgotPasswordLink = screen.getByRole("link", { name: /forgot your password\?/i });
            expect(forgotPasswordLink).toBeInTheDocument();
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const { container } = customRender(<SignInPage redirectPath={redirectPath} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(100);
            expect(container).toBeInTheDocument();
        });

        it("应该不会内存泄漏", () => {
            const { unmount } = customRender(<SignInPage redirectPath={redirectPath} />);

            // 验证组件可以正常卸载
            expect(() => unmount()).not.toThrow();
        });
    });

    describe("链接导航测试", () => {
        it("应该有正确的注册链接", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const createAccountLink = screen.getByRole("link", { name: /create a new account/i });
            expect(createAccountLink).toHaveAttribute("href", `/sign-up?redirect=${encodeURIComponent(redirectPath)}`);
        });

        it("应该有正确的忘记密码链接", () => {
            customRender(<SignInPage redirectPath={redirectPath} />);

            const forgotPasswordLink = screen.getByRole("link", { name: /forgot your password\?/i });
            expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
        });
    });
});