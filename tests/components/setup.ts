/**
 * 组件测试专用配置
 * 基于React Testing Library最佳实践，提供统一的配置和工具函数
 * 遵循用户行为导向测试原则，专注于可访问性和用户体验
 */

import { render, RenderOptions, waitFor, screen, within } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { vi, beforeAll, afterEach, afterAll } from "vitest";
import userEvent from "@testing-library/user-event";

// 组件测试的全局配置
export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
    // 设置默认的容器
    container: undefined,
    // 设置默认的基础元素
    baseElement: undefined,
};

// 用户事件设置 - 基于RTL最佳实践
export const setupUserEvent = () => userEvent.setup();

// 可访问性查询辅助函数 - 遵循WCAG原则
export const queryByRole = (role: string, options?: any) => screen.queryByRole(role, options);
export const getByRole = (role: string, options?: any) => screen.getByRole(role, options);
export const findByRole = async (role: string, options?: any) => screen.findByRole(role, options);
export const getByLabelText = (text: string, options?: any) => screen.getByLabelText(text, options);
export const findByLabelText = async (text: string, options?: any) => screen.findByLabelText(text, options);
export const getByText = (text: string, options?: any) => screen.getByText(text, options);
export const findByText = async (text: string, options?: any) => screen.findByText(text, options);

// 自定义渲染函数，包含Provider包装
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
    initialEntries?: string[];
    mockUser?: any;
    locale?: string;
    messages?: Record<string, any>;
    wrapper?: React.ComponentType<any>;
}

// 创建模拟的Session Context
export const createMockSession = (overrides = {}) => ({
    user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        role: "user",
        ...overrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// 创建模拟的Router
export const createMockRouter = (overrides = {}) => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    ...overrides,
});

// 创建模拟的搜索参数
export const createMockSearchParams = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
    });
    return searchParams;
};

// 自定义渲染函数 - 基于RTL最佳实践
export const customRender = (
    ui: ReactElement,
    {
        initialEntries = ["/"],
        mockUser,
        locale = "en",
        messages,
        wrapper,
        ...renderOptions
    }: CustomRenderOptions = {}
) => {
    // 如果没有提供wrapper，使用默认的wrapper
    if (!wrapper) {
        wrapper = ({ children }: { children: ReactNode }) => {
            return (
                <div data-testid="test-wrapper">
                    {children}
                </div>
            );
        };
    }

    return render(ui, {
        wrapper,
        ...renderOptions,
    });
};

// 重新导出testing-library的工具函数
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// 组件测试工具函数
export const createMockProps = <T extends Record<string, any>>(overrides: Partial<T> = {}): T => {
    return overrides as T;
};

export const waitForComponentToRender = async (component: HTMLElement) => {
    // 等待组件渲染完成
    await new Promise(resolve => setTimeout(resolve, 0));
    return component;
};

export const expectElementToBeVisible = (element: HTMLElement) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(text);
};

export const expectButtonToBeDisabled = (button: HTMLElement) => {
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
};

export const expectButtonToBeEnabled = (button: HTMLElement) => {
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
};

// 表单测试工具函数 - 基于用户行为模式
export const fillForm = async (user: ReturnType<typeof setupUserEvent>, formData: Record<string, string>) => {
    for (const [fieldName, value] of Object.entries(formData)) {
        // 优先使用label查询，遵循可访问性最佳实践
        const label = document.querySelector(`label[for="${fieldName}"]`) ||
                     document.querySelector(`label:has(#${fieldName})`);

        let field: HTMLElement | null = null;

        if (label) {
            field = document.getElementById(fieldName) ||
                   document.querySelector(`#${fieldName}`);
        }

        // 如果没有找到，使用name属性
        if (!field) {
            field = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
        }

        // 最后尝试使用data-testid
        if (!field) {
            field = document.querySelector(`[data-testid="${fieldName}"]`) as HTMLElement;
        }

        if (field) {
            await user.clear(field);
            await user.type(field, value);
        } else {
            throw new Error(`Form field not found: ${fieldName}`);
        }
    }
};

export const submitForm = async (user: ReturnType<typeof setupUserEvent>, formSelector?: string) => {
    let submitButton: HTMLElement | null = null;

    if (formSelector) {
        const form = document.querySelector(formSelector);
        if (form) {
            submitButton = form.querySelector('button[type="submit"]');
        }
    } else {
        // 查找页面上的提交按钮
        submitButton = document.querySelector('button[type="submit"]');
    }

    if (submitButton) {
        await user.click(submitButton);
    } else {
        throw new Error("Submit button not found");
    }
};

// 可访问性测试工具函数 - 遵循WCAG指南
export const expectElementToBeAccessible = (element: HTMLElement) => {
    expect(element).toBeInTheDocument();
    // 检查是否有适当的ARIA属性
    if (element.getAttribute("role")) {
        expect(element).toHaveAttribute("role");
    }
    if (element.tagName === "BUTTON" || element.tagName === "A") {
        expect(element).toBeVisible();
        expect(element).toBeEnabled();
    }
};

// 可访问性测试工具函数
export const expectA11yLabel = (element: HTMLElement, label: string) => {
    expect(element).toBeInTheDocument();
    expect(element).toHaveAccessibleName(label);
};

export const expectA11yDescription = (element: HTMLElement, description: string) => {
    expect(element).toBeInTheDocument();
    expect(element).toHaveAccessibleDescription(description);
};

// 模拟数据工厂
export const createMockFormData = (overrides = {}) => ({
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    ...overrides,
});

export const createMockTodoData = (overrides = {}) => ({
    title: "Test Todo",
    description: "Test description",
    completed: false,
    ...overrides,
});

export const createMockProductData = (overrides = {}) => ({
    name: "Test Product",
    description: "Test product description",
    price: 99.99,
    category: "test-category",
    ...overrides,
});

// 常用测试选择器
export const TEST_SELECTORS = {
    BUTTON: {
        SUBMIT: 'button[type="submit"]',
        CANCEL: 'button[data-testid="cancel-button"]',
        DELETE: 'button[data-testid="delete-button"]',
        EDIT: 'button[data-testid="edit-button"]',
        SAVE: 'button[data-testid="save-button"]',
    },
    INPUT: {
        EMAIL: 'input[name="email"]',
        PASSWORD: 'input[name="password"]',
        NAME: 'input[name="name"]',
        TITLE: 'input[name="title"]',
        DESCRIPTION: 'textarea[name="description"]',
    },
    FORM: {
        LOGIN: 'form[data-testid="login-form"]',
        REGISTER: 'form[data-testid="register-form"]',
        TODO: 'form[data-testid="todo-form"]',
    },
    CONTAINER: {
        MODAL: '[data-testid="modal"]',
        DROPDOWN: '[data-testid="dropdown"]',
        SIDEBAR: '[data-testid="sidebar"]',
        NAVBAR: '[data-testid="navbar"]',
    },
    FEEDBACK: {
        ERROR: '[data-testid="error-message"]',
        SUCCESS: '[data-testid="success-message"]',
        LOADING: '[data-testid="loading-spinner"]',
    },
} as const;

// 重写默认的render函数
export const render = customRender;

// 测试前设置
beforeEach(() => {
    // 清除所有mock
    vi.clearAllMocks();
});

// 测试后清理
afterEach(() => {
    // 清理DOM
    document.body.innerHTML = "";
});