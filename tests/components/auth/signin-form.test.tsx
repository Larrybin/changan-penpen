import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen } from "@testing-library/react";

import { LoginForm } from "@/modules/auth/components/login-form";

import { customRender, setupUserEvent } from "../setup";

const routerPushMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const socialSignInMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastInfoMock = vi.hoisted(() => vi.fn());

const translationMap = vi.hoisted(() => ({
    "AuthForms.Login": {
        title: "登录",
        description: "欢迎回来",
        googleCta: "使用 Google 登录",
        continueWith: "或继续",
        forgotPassword: "忘记密码",
        submit: "登录",
        switchPrompt: "还没有账号？",
        switchCta: "注册",
    },
    "AuthForms.Shared": {
        continueWith: "或继续",
        loading: "加载中",
        agreement: {
            prefix: "同意",
            terms: "服务条款",
            conjunction: "和",
            privacy: "隐私政策",
        },
        fields: {
            email: {
                label: "邮箱",
                placeholder: "输入邮箱",
            },
            password: {
                label: "密码",
                placeholder: "输入密码",
            },
        },
    },
    "AuthForms.Validation": {
        email: {
            required: "邮箱必填",
            invalid: "请输入有效邮箱",
        },
        password: {
            required: "密码必填",
            min: "密码至少8位",
        },
    },
    "AuthForms.Messages": {
        signInSuccess: "登录成功",
        socialSignInError: "社交登录失败",
    },
}));

function resolveTranslation(namespace: string, key: string): string {
    const segments = key.split(".");
    let current: unknown = translationMap[namespace as keyof typeof translationMap];

    for (const segment of segments) {
        if (typeof current !== "object" || current === null) {
            return `${namespace}.${key}`;
        }
        current = (current as Record<string, unknown>)[segment];
    }

    if (typeof current === "string") {
        return current;
    }

    return `${namespace}.${key}`;
}

vi.mock("next-intl", () => ({
    useTranslations: (namespace: string) => (key: string) => resolveTranslation(namespace, key),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: routerPushMock,
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
}));

vi.mock("@/modules/auth/utils/auth-client", () => ({
    authClient: {
        signIn: {
            social: (...args: unknown[]) => socialSignInMock(...args),
        },
    },
}));

vi.mock("@/modules/auth/actions/auth.action", () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("@/lib/toast", () => {
    const mockToast = Object.assign(vi.fn(), {
        success: toastSuccessMock,
        error: toastErrorMock,
        info: toastInfoMock,
    });

    return {
        toast: mockToast,
        default: mockToast,
    };
});

describe("LoginForm", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
        routerPushMock.mockReset();
        signInMock.mockReset();
        socialSignInMock.mockReset();
        toastSuccessMock.mockReset();
        toastErrorMock.mockReset();
        toastInfoMock.mockReset();
    });

    const renderForm = () => customRender(<LoginForm />);

    it("renders email and password fields", () => {
        renderForm();

        expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
        expect(screen.getByLabelText("密码")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "使用 Google 登录" })).toBeInTheDocument();
    });

    it("submits credentials and redirects on success", async () => {
        signInMock.mockResolvedValueOnce({ success: true, messageKey: "signInSuccess" });

        renderForm();

        await user.type(screen.getByLabelText("邮箱"), "user@example.com");
        await user.type(screen.getByLabelText("密码"), "password123");
        await user.click(screen.getByRole("button", { name: "登录" }));

        expect(signInMock).toHaveBeenCalledWith({
            email: "user@example.com",
            password: "password123",
        });
        expect(toastSuccessMock).toHaveBeenCalledWith("登录成功");
        expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
    });

    it("shows an error toast when social sign-in fails", async () => {
        socialSignInMock.mockRejectedValueOnce(new Error("network"));

        renderForm();

        await user.click(screen.getByRole("button", { name: "使用 Google 登录" }));

        expect(toastErrorMock).toHaveBeenCalledWith("社交登录失败");
    });

    it("informs the user when forgot password is clicked", async () => {
        renderForm();

        await user.click(screen.getByRole("button", { name: "忘记密码" }));

        expect(toastInfoMock).toHaveBeenCalledTimes(1);
    });
});
