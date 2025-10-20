/**
 * 组件测试工具函数库
 * 基于React Testing Library最佳实践
 * 提供常用的测试模式和断言函数
 */

import { expect, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 通用测试断言函数
export const expectElementToBeVisible = (element: HTMLElement) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
    expectElementToBeVisible(element);
    expect(element).toHaveTextContent(text);
};

export const expectElementToHaveAttribute = (element: HTMLElement, attribute: string, value?: string) => {
    expectElementToBeVisible(element);
    if (value) {
        expect(element).toHaveAttribute(attribute, value);
    } else {
        expect(element).toHaveAttribute(attribute);
    }
};

// 表单专用测试函数
export const expectFormToHaveValidationErrors = async (errorMessages: string[]) => {
    for (const errorMessage of errorMessages) {
        const errorElement = await screen.findByText(errorMessage, {}, { timeout: 1000 });
        expectElementToBeVisible(errorElement);
    }
};

export const expectFormToBeValid = () => {
    const errorElements = screen.queryAllByRole("alert");
    expect(errorElements).toHaveLength(0);
};

// 异步状态测试辅助函数
export const waitForLoadingToFinish = async (timeout = 5000) => {
    await waitFor(
        () => {
            const loadingElements = screen.queryAllByRole("progressbar");
            const loadingTexts = screen.queryAllByText(/loading|submitting|processing/i);
            expect(loadingElements.length + loadingTexts.length).toBe(0);
        },
        { timeout }
    );
};

export const waitForElementToAppear = async (text: string, timeout = 5000) => {
    return await screen.findByText(text, {}, { timeout });
};

export const waitForElementToDisappear = async (text: string, timeout = 5000) => {
    await waitFor(
        () => {
            const element = screen.queryByText(text);
            expect(element).not.toBeInTheDocument();
        },
        { timeout }
    );
};

// 用户交互辅助函数
export const fillFormField = async (
    fieldLabel: string,
    value: string,
    options?: { clearFirst?: boolean }
) => {
    const user = userEvent.setup();
    const field = screen.getByLabelText(fieldLabel) as HTMLInputElement;

    if (options?.clearFirst) {
        await user.clear(field);
    }

    await user.type(field, value);
    return field;
};

export const selectDropdownOption = async (
    triggerLabel: string,
    optionText: string
) => {
    const user = userEvent.setup();

    // 打开下拉菜单
    const trigger = screen.getByText(triggerLabel);
    await user.click(trigger);

    // 选择选项
    const option = screen.getByText(optionText);
    await user.click(option);
};

export const toggleSwitch = async (switchLabel: string) => {
    const user = userEvent.setup();
    const switchElement = screen.getByLabelText(switchLabel);
    await user.click(switchElement);
};

export const clickButton = async (buttonText: string, options?: { exact?: boolean }) => {
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: buttonText, exact: options?.exact });
    await user.click(button);
    return button;
};

// 可访问性测试辅助函数
export const expectComponentToBeAccessible = (container: HTMLElement) => {
    // 检查是否有适当的语义化标记
    const buttons = within(container).getAllByRole("button");
    const links = within(container).getAllByRole("link");
    const headings = within(container).getAllByRole("heading");

    // 验证所有交互元素都有适当的可访问性属性
    [...buttons, ...links].forEach(element => {
        expect(element).toBeVisible();
        if (element.tagName === "BUTTON") {
            expect(element).toBeEnabled();
        }
    });

    // 验证标题层次结构
    headings.forEach(heading => {
        expect(heading).toBeVisible();
    });
};

export const expectFormToBeAccessible = (container: HTMLElement) => {
    const inputs = within(container).getAllByRole("textbox");
    const textareas = within(container).getAllByRole("textbox", { name: "textarea" });
    const selects = within(container).getAllByRole("combobox");

    [...inputs, ...textareas, ...selects].forEach(input => {
        // 每个输入字段都应该有标签
        const label = input.getAttribute("aria-label") ||
                     input.getAttribute("aria-labelledby") ||
                     document.querySelector(`label[for="${input.id}"]`);

        expect(label).toBeTruthy();
        expect(input).toBeVisible();
    });
};

// Mock函数测试辅助函数
export const expectCallbackToHaveBeenCalled = (mockFn: any, expectedArgs?: any) => {
    expect(mockFn).toHaveBeenCalled();
    if (expectedArgs) {
        expect(mockFn).toHaveBeenCalledWith(expectedArgs);
    }
};

export const expectCallbackToHaveBeenCalledTimes = (mockFn: any, times: number) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
};

// 性能测试辅助函数
export const measureRenderTime = (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    const end = performance.now();
    return end - start;
};

export const expectRenderToBeFast = (renderFn: () => void, maxTimeMs = 100) => {
    const renderTime = measureRenderTime(renderFn);
    expect(renderTime).toBeLessThan(maxTimeMs);
};

// 响应式测试辅助函数
export const resizeViewport = (width: number, height: number = width) => {
    Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width,
    });
    Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: height,
    });

    // 触发resize事件
    window.dispatchEvent(new Event("resize"));
};

// 本地化测试辅助函数
export const expectComponentToHaveCorrectLocale = (container: HTMLElement, locale: string) => {
    const htmlElement = document.documentElement;
    expect(htmlElement).toHaveAttribute("lang", locale);
};

// 数据测试辅助函数
export const expectElementToHaveCorrectData = (
    element: HTMLElement,
    data: Record<string, any>
) => {
    Object.entries(data).forEach(([key, value]) => {
        expect(element).toHaveAttribute(`data-${key}`, String(value));
    });
};

// 样式测试辅助函数
export const expectElementToHaveClasses = (element: HTMLElement, expectedClasses: string[]) => {
    expectedClasses.forEach(className => {
        expect(element).toHaveClass(className);
    });
};

export const expectElementToHaveStyles = (
    element: HTMLElement,
    expectedStyles: Partial<CSSStyleDeclaration>
) => {
    Object.entries(expectedStyles).forEach(([property, value]) => {
        expect(element.style).toHaveProperty(property, value);
    });
};

// 错误边界测试辅助函数
export const expectErrorBoundaryToCatch = (error: Error) => {
    // 这个函数需要与你的错误边界实现配合使用
    const errorBoundary = document.querySelector('[data-testid="error-boundary"]');
    if (errorBoundary) {
        expect(errorBoundary).toHaveTextContent(/something went wrong/i);
    }
};

// 路由测试辅助函数
export const expectNavigationToHaveOccurred = (mockPush: any, expectedPath: string) => {
    expect(mockPush).toHaveBeenCalledWith(expectedPath);
};

// 测试数据工厂
export const createTestUser = (overrides = {}) => ({
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "user",
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createTestTodo = (overrides = {}) => ({
    id: "test-todo-id",
    title: "Test Todo",
    description: "Test description",
    completed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createTestProduct = (overrides = {}) => ({
    id: "test-product-id",
    name: "Test Product",
    description: "Test product description",
    price: 99.99,
    category: "test",
    inStock: true,
    ...overrides,
});

// 测试环境清理辅助函数
export const cleanupTestEnvironment = () => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    localStorage.clear();
    sessionStorage.clear();
};

// 重定向测试辅助函数
export const expectRedirectToHaveOccurred = (mockReplace: any, expectedPath: string) => {
    expect(mockReplace).toHaveBeenCalledWith(expectedPath);
};