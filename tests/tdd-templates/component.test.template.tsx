/**
 * React组件TDD测试模板 v2.0
 * 基于React Testing Library最新最佳实践
 * 遵循用户行为导向测试原则，专注于用户交互和可访问性
 *
 * 更新时间：2025-01-20
 * 适配版本：@testing-library/react@13+, @testing-library/user-event@14+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { customRender, setupUserEvent } from "../components/setup";

/**
 * 组件TDD测试模板使用说明
 *
 * 🚀 快速开始：
 * 1. 复制此模板到组件测试文件
 * 2. 替换ComponentName为实际组件名
 * 3. 根据组件特性调整测试用例
 * 4. 遵循红-绿-重构TDD循环
 *
 * 📋 最佳实践：
 * - 优先使用 getByLabelText, getByRole, getByText 等语义化查询
 * - 避免使用 testid，除非没有其他选择
 * - 测试用户行为而非实现细节
 * - 使用 userEvent 模拟真实用户交互
 * - 使用 waitFor 处理异步状态更新
 *
 * 🎯 测试覆盖目标：
 * - 基础渲染和可访问性
 * - 用户交互和状态管理
 * - 边界条件和错误处理
 * - 性能和集成测试场景
 *
 * 🔄 TDD循环：
 * 1. Red: 编写失败的测试
 * 2. Green: 编写最少代码使测试通过
 * 3. Refactor: 重构代码保持测试通过
 */

// 测试数据工厂
const createMockProps = (overrides = {}) => ({
    // 在这里定义组件的默认props
    ...overrides,
});

describe("ComponentName", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染组件", () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 使用可访问性查询验证组件存在
            const component = screen.getByRole("button", { name: /component name/i });
            expect(component).toBeInTheDocument();
        });

        it("应该显示必要的内容", () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 验证组件显示的文本内容
            expect(screen.getByText(/expected text/i)).toBeInTheDocument();
        });

        it("应该有正确的语义化HTML结构", () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 验证语义化HTML结构
            const mainElement = screen.getByRole("main");
            expect(mainElement).toBeInTheDocument();
        });
    });

    describe("用户交互测试", () => {
        it("应该响应用户点击操作", async () => {
            const mockOnClick = vi.fn();
            const props = createMockProps({ onClick: mockOnClick });

            customRender(<ComponentName {...props} />);

            const clickableElement = screen.getByRole("button");
            await user.click(clickableElement);

            expect(mockOnClick).toHaveBeenCalledTimes(1);
        });

        it("应该处理表单输入", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 使用更语义化的查询方法
            const input = screen.getByLabelText(/input label/i);
            await user.clear(input); // 先清空字段
            await user.type(input, "test input value");

            expect(input).toHaveValue("test input value");
        });

        it("应该处理键盘交互", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const interactiveElement = screen.getByRole("button");
            interactiveElement.focus();
            expect(interactiveElement).toHaveFocus();

            await user.keyboard("{Enter}");

            // 验证键盘交互结果
        });

        it("应该处理悬停状态", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const hoverableElement = screen.getByRole("button");
            await user.hover(hoverableElement);

            // 验证悬停效果
            expect(hoverableElement).toBeInTheDocument();
        });

        it("应该处理焦点管理", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const firstInteractive = screen.getByRole("button");
            await user.tab();

            // 验证焦点正确移动
            expect(document.activeElement).toBe(firstInteractive);
        });
    });

    describe("状态管理测试", () => {
        it("应该正确处理加载状态", async () => {
            const props = createMockProps({ loading: true });
            customRender(<ComponentName {...props} />);

            // 等待加载状态出现
            const loadingElement = await screen.findByText(/loading/i);
            expect(loadingElement).toBeInTheDocument();

            // 验证加载状态下的UI变化
            const disabledButton = screen.getByRole("button", { name: /submit/i });
            expect(disabledButton).toBeDisabled();
        });

        it("应该正确处理错误状态", async () => {
            const props = createMockProps({ error: "Test error message" });
            customRender(<ComponentName {...props} />);

            const errorElement = await screen.findByText(/test error message/i);
            expect(errorElement).toBeInTheDocument();
        });

        it("应该正确处理成功状态", async () => {
            const props = createMockProps({ success: true });
            customRender(<ComponentName {...props} />);

            const successElement = await screen.findByText(/success/i);
            expect(successElement).toBeInTheDocument();
        });
    });

    describe("边界条件测试", () => {
        it("应该处理空props", () => {
            customRender(<ComponentName />);

            // 验证组件在无props时的行为
            expect(screen.getByRole("button")).toBeInTheDocument();
        });

        it("应该处理无效输入", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const input = screen.getByLabelText(/input label/i);
            await user.type(input, "invalid input");
            await user.click(screen.getByRole("button", { name: /submit/i }));

            // 验证错误处理
            expect(await screen.findByText(/invalid input/i)).toBeInTheDocument();
        });

        it("应该处理网络错误", async () => {
            // Mock网络错误
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            await user.click(screen.getByRole("button", { name: /submit/i }));

            expect(await screen.findByText(/network error/i)).toBeInTheDocument();
        });
    });

    describe("可访问性测试", () => {
        it("应该有适当的ARIA属性", () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const button = screen.getByRole("button");
            expect(button).toHaveAttribute("aria-label");
        });

        it("应该支持键盘导航", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            const button = screen.getByRole("button");
            button.focus();
            expect(button).toHaveFocus();

            await user.keyboard("{Enter}");
            // 验证键盘导航结果
        });

        it("应该有正确的颜色对比度", () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 这里可以添加颜色对比度检查
            // 例如使用axe-core进行可访问性测试
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内渲染", () => {
            const startTime = performance.now();

            const props = createMockProps();
            const { container } = customRender(<ComponentName {...props} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            expect(renderTime).toBeLessThan(100); // 100ms渲染时间限制
            expect(container).toBeInTheDocument();
        });

        it("应该正确清理副作用", () => {
            const { unmount } = customRender(<ComponentName />);

            // 验证组件卸载时的清理
            unmount();

            // 验证副作用被正确清理
            expect(screen.queryByRole("button")).not.toBeInTheDocument();
        });

        it("应该高效处理大量数据", () => {
            const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
            const props = createMockProps({ items: largeData });

            const { container } = customRender(<ComponentName {...props} />);
            expect(container).toBeInTheDocument();
        });
    });

    describe("高级测试模式", () => {
        it("应该支持异步状态更新", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 模拟异步操作
            const asyncButton = screen.getByRole("button", { name: /async action/i });
            await user.click(asyncButton);

            // 使用waitFor等待异步状态更新
            await waitFor(() => {
                expect(screen.getByText(/async completed/i)).toBeInTheDocument();
            });
        });

        it("应该处理条件渲染", () => {
            const props = createMockProps({ condition: true });
            const { rerender } = customRender(<ComponentName {...props} />);

            expect(screen.getByText(/conditional content/i)).toBeInTheDocument();

            // 重新渲染以测试条件变化
            rerender(<ComponentName {...props} condition={false} />);
            expect(screen.queryByText(/conditional content/i)).not.toBeInTheDocument();
        });

        it("应该处理组件通信", async () => {
            const mockCallback = vi.fn();
            const props = createMockProps({ onAction: mockCallback });

            customRender(<ComponentName {...props} />);

            const actionButton = screen.getByRole("button", { name: /trigger action/i });
            await user.click(actionButton);

            expect(mockCallback).toHaveBeenCalledWith(expect.any(Object));
        });

        it("应该处理错误边界", () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            const props = createMockProps({ shouldError: true });
            customRender(<ComponentName {...props} />);

            // 验证错误处理逻辑
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

            consoleError.mockRestore();
        });

        it("应该支持国际化", () => {
            const props = createMockProps({ locale: "zh-CN" });
            customRender(<ComponentName {...props} />);

            expect(screen.getByText(/中文内容/i)).toBeInTheDocument();
        });
    });

    describe("集成测试场景", () => {
        it("应该处理完整的用户流程", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 模拟完整的用户操作流程
            await user.type(screen.getByLabelText(/name/i), "Test User");
            await user.type(screen.getByLabelText(/email/i), "test@example.com");
            await user.selectOptions(screen.getByLabelText(/role/i), "Admin");
            await user.click(screen.getByRole("button", { name: /submit/i }));

            await waitFor(() => {
                expect(screen.getByText(/success/i)).toBeInTheDocument();
            });
        });

        it("应该处理表单验证流程", async () => {
            const props = createMockProps();
            customRender(<ComponentName {...props} />);

            // 提交空表单
            await user.click(screen.getByRole("button", { name: /submit/i }));

            // 验证错误消息
            expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
            expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

            // 填写有效数据
            await user.type(screen.getByLabelText(/name/i), "Valid Name");
            await user.type(screen.getByLabelText(/email/i), "valid@example.com");
            await user.click(screen.getByRole("button", { name: /submit/i }));

            // 验证提交成功
            await waitFor(() => {
                expect(screen.getByText(/success/i)).toBeInTheDocument();
            });
        });
    });
});

// 组件类型定义（根据实际组件调整）
interface ComponentNameProps {
    onClick?: (event: any) => void;
    loading?: boolean;
    error?: string;
    success?: boolean;
    [key: string]: any;
}

// 你的组件导入（取消注释并修改路径）
// import { ComponentName } from "../../../path/to/ComponentName";