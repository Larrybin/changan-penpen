/**
 * 高质量表单组件测试模板
 * 基于React Testing Library最佳实践
 * 遵循用户行为导向测试原则，专注可访问性
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    customRender,
    setupUserEvent,
    getByRole,
    getByLabelText,
    findByText,
    expectElementToBeAccessible,
    fillForm,
    submitForm,
    createMockFormData
} from "../setup";

// 使用说明：
// 1. 复制此模板
// 2. 替换YourComponent为实际组件名
// 3. 根据组件特性调整测试用例
// 4. 遵循用户行为导向测试原则

describe("YourComponent", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
        // 每个测试前重置所有mock
        vi.clearAllMocks();
    });

    afterEach(() => {
        // 清理DOM
        document.body.innerHTML = "";
    });

    describe("可访问性测试", () => {
        it("应该渲染正确的语义化HTML结构", () => {
            customRender(<YourComponent />);

            // 优先使用role查询，遵循可访问性原则
            const form = getByRole("form");
            expectElementToBeAccessible(form);

            // 检查是否有适当的标题
            const heading = getByRole("heading", { level: 2 });
            expect(heading).toBeInTheDocument();
        });

        it("应该为所有表单字段提供适当的标签", () => {
            customRender(<YourComponent />);

            // 使用label文本查询，确保可访问性
            const emailInput = getByLabelText(/email/i);
            const passwordInput = getByLabelText(/password/i);

            expectElementToBeAccessible(emailInput);
            expectElementToBeAccessible(passwordInput);
        });

        it("应该有适当的按钮描述", () => {
            customRender(<YourComponent />);

            // 查找提交按钮
            const submitButton = getByRole("button", { name: /submit|login|register/i });
            expectElementToBeAccessible(submitButton);
        });
    });

    describe("用户交互测试", () => {
        it("应该允许用户填写表单字段", async () => {
            customRender(<YourComponent />);

            const formData = createMockFormData({
                email: "test@example.com",
                password: "password123",
            });

            // 使用用户行为导向的方式填写表单
            await fillForm(user, formData);

            // 验证字段已正确填写
            const emailInput = getByLabelText(/email/i) as HTMLInputElement;
            const passwordInput = getByLabelText(/password/i) as HTMLInputElement;

            expect(emailInput.value).toBe(formData.email);
            expect(passwordInput.value).toBe(formData.password);
        });

        it("应该在表单提交时显示加载状态", async () => {
            customRender(<YourComponent />);

            const formData = createMockFormData();
            await fillForm(user, formData);

            // 提交表单
            const submitButton = getByRole("button", { name: /submit/i });

            // 在异步操作期间按钮应该显示加载状态
            await user.click(submitButton);

            // 等待加载状态出现
            const loadingElement = await findByText(/loading|submitting|processing/i, {}, { timeout: 1000 });
            expect(loadingElement).toBeInTheDocument();
        });

        it("应该在表单验证失败时显示错误信息", async () => {
            customRender(<YourComponent />);

            // 提交空表单以触发验证错误
            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 等待错误信息出现
            const errorMessage = await findByText(/required|invalid|error/i, {}, { timeout: 1000 });
            expect(errorMessage).toBeInTheDocument();
        });
    });

    describe("表单验证测试", () => {
        it("应该验证必填字段", async () => {
            customRender(<YourComponent />);

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 检查每个必填字段的错误信息
            const emailError = await findByText(/email.*required/i, {}, { timeout: 1000 });
            const passwordError = await findByText(/password.*required/i, {}, { timeout: 1000 });

            expect(emailError).toBeInTheDocument();
            expect(passwordError).toBeInTheDocument();
        });

        it("应该验证邮箱格式", async () => {
            customRender(<YourComponent />);

            const invalidEmail = "invalid-email";
            await fillForm(user, { email: invalidEmail });

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            const emailError = await findByText(/invalid.*email/i, {}, { timeout: 1000 });
            expect(emailError).toBeInTheDocument();
        });

        it("应该验证密码长度", async () => {
            customRender(<YourComponent />);

            const shortPassword = "123";
            await fillForm(user, { password: shortPassword });

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            const passwordError = await findByText(/password.*too.*short/i, {}, { timeout: 1000 });
            expect(passwordError).toBeInTheDocument();
        });
    });

    describe("成功提交测试", () => {
        it("应该在有效数据提交成功后显示成功信息", async () => {
            customRender(<YourComponent />);

            const validFormData = createMockFormData({
                email: "success@example.com",
                password: "validpassword123",
            });

            await fillForm(user, validFormData);

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 等待成功信息出现
            const successMessage = await findByText(/success|welcome|logged in/i, {}, { timeout: 2000 });
            expect(successMessage).toBeInTheDocument();
        });

        it("应该在成功提交后调用相应的处理函数", async () => {
            const mockOnSubmit = vi.fn();
            customRender(<YourComponent onSubmit={mockOnSubmit} />);

            const validFormData = createMockFormData();
            await fillForm(user, validFormData);

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 验证回调函数被调用
            expect(mockOnSubmit).toHaveBeenCalledWith(validFormData);
        });
    });

    describe("错误处理测试", () => {
        it("应该处理网络错误", async () => {
            // Mock网络错误
            vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

            customRender(<YourComponent />);

            const validFormData = createMockFormData();
            await fillForm(user, validFormData);

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            const networkError = await findByText(/network.*error|try again/i, {}, { timeout: 2000 });
            expect(networkError).toBeInTheDocument();
        });

        it("应该处理服务器错误", async () => {
            customRender(<YourComponent />);

            const validFormData = createMockFormData();
            await fillForm(user, validFormData);

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            // 模拟服务器返回错误
            const serverError = await findByText(/server.*error|internal.*error/i, {}, { timeout: 2000 });
            expect(serverError).toBeInTheDocument();
        });
    });

    describe("边界情况测试", () => {
        it("应该处理重复提交", async () => {
            customRender(<YourComponent />);

            const validFormData = createMockFormData();
            await fillForm(user, validFormData);

            const submitButton = getByRole("button", { name: /submit/i });

            // 快速点击两次
            await user.click(submitButton);
            await user.click(submitButton);

            // 验证只提交了一次
            await findByText(/success|welcome/i, {}, { timeout: 2000 });

            // 验证第二次点击被忽略（按钮应该被禁用）
            expect(submitButton).toBeDisabled();
        });

        it("应该处理超长输入", async () => {
            customRender(<YourComponent />);

            const longEmail = "a".repeat(300) + "@example.com";
            await fillForm(user, { email: longEmail });

            const submitButton = getByRole("button", { name: /submit/i });
            await user.click(submitButton);

            const lengthError = await findByText(/too.*long|maximum.*length/i, {}, { timeout: 1000 });
            expect(lengthError).toBeInTheDocument();
        });
    });

    describe("国际化测试", () => {
        it("应该正确显示不同语言的内容", () => {
            const frenchMessages = {
                // 你的法语消息
            };

            customRender(<YourComponent />, {
                locale: "fr",
                messages: frenchMessages,
            });

            // 验证法语内容
            const heading = getByRole("heading", { level: 2 });
            expect(heading).toHaveTextContent(/connexion/i); // 法语"登录"
        });
    });

    describe("响应式设计测试", () => {
        it("应该在移动设备上正常显示", () => {
            // 模拟移动设备视口
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: 375,
            });

            customRender(<YourComponent />);

            const form = getByRole("form");
            expect(form).toBeInTheDocument();
            expectElementToBeAccessible(form);
        });
    });
});

// 组件类型定义（根据你的实际组件调整）
interface YourComponentProps {
    onSubmit?: (data: any) => void;
    initialData?: any;
    disabled?: boolean;
}

// 你的组件导入
// import { YourComponent } from "../../../path/to/YourComponent";