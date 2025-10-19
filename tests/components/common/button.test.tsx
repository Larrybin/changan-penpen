/**
 * Button组件测试
 * 基于React Testing Library最佳实践
 * 测试项目真实Button组件的各种状态和交互
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { customRender, setupUserEvent, getByRole, expectElementToBeAccessible } from "../setup";
import { Button } from "@/components/ui/button";

describe("Button组件", () => {
    let user: ReturnType<typeof setupUserEvent>;

    beforeEach(() => {
        user = setupUserEvent();
    });

    describe("基础渲染测试", () => {
        it("应该正确渲染按钮文本", () => {
            customRender(<MockButton>Click me</MockButton>);

            const button = getByRole("button", { name: /click me/i });
            expect(button).toBeInTheDocument();
            expectElementToBeAccessible(button);
        });

        it("应该有正确的role属性", () => {
            customRender(<MockButton>Submit</MockButton>);

            const button = getByRole("button");
            expect(button).toBeInTheDocument();
        });

        it("应该支持自定义data-slot属性", () => {
            customRender(<Button>Test Button</Button>);

            const button = document.querySelector('[data-slot="button"]');
            expect(button).toBeInTheDocument();
        });
    });

    describe("状态测试", () => {
        it("应该在禁用状态下不可点击", () => {
            const mockClick = vi.fn();
            customRender(
                <MockButton disabled onClick={mockClick}>
                    Disabled Button
                </MockButton>
            );

            const button = getByRole("button", { name: /disabled button/i });
            expect(button).toBeDisabled();

            // 尝试点击
            user.click(button);
            expect(mockClick).not.toHaveBeenCalled();
        });

        it("应该在禁用状态下正确渲染", () => {
            customRender(<Button disabled>Disabled Button</Button>);

            const button = getByRole("button", { name: /disabled button/i });
            expect(button).toBeDisabled();
            expect(button).toHaveClass("disabled:opacity-50");
        });
    });

    describe("交互测试", () => {
        it("应该在点击时调用onClick处理函数", async () => {
            const mockClick = vi.fn();
            customRender(
                <MockButton onClick={mockClick}>
                    Clickable Button
                </MockButton>
            );

            const button = getByRole("button", { name: /clickable button/i });
            await user.click(button);

            expect(mockClick).toHaveBeenCalledTimes(1);
        });

        it("应该支持键盘交互", async () => {
            const mockClick = vi.fn();
            customRender(
                <MockButton onClick={mockClick}>
                    Keyboard Button
                </MockButton>
            );

            const button = getByRole("button", { name: /keyboard button/i });
            button.focus();
            await user.keyboard("{Enter}");

            expect(mockClick).toHaveBeenCalledTimes(1);
        });

        it("应该支持空格键交互", async () => {
            const mockClick = vi.fn();
            customRender(
                <MockButton onClick={mockClick}>
                    Space Button
                </MockButton>
            );

            const button = getByRole("button", { name: /space button/i });
            button.focus();
            await user.keyboard(" ");

            expect(mockClick).toHaveBeenCalledTimes(1);
        });
    });

    describe("可访问性测试", () => {
        it("应该有适当的ARIA属性", () => {
            customRender(<MockButton loading>Accessible Button</MockButton>);

            const button = getByRole("button", { name: /loading/i });
            expect(button).toHaveAttribute("aria-busy", "true");
        });

        it("应该在禁用状态时有适当的ARIA属性", () => {
            customRender(<MockButton disabled>Disabled Button</MockButton>);

            const button = getByRole("button", { name: /disabled button/i });
            expect(button).toBeDisabled();
        });

        it("应该支持focus管理", () => {
            customRender(<MockButton>Focus Button</MockButton>);

            const button = getByRole("button", { name: /focus button/i });
            button.focus();
            expect(button).toHaveFocus();
        });
    });

    describe("变体测试", () => {
        it("应该渲染不同变体的按钮", () => {
            const { rerender } = customRender(<Button variant="default">Default</Button>);

            let button = getByRole("button", { name: /default/i });
            expect(button).toHaveClass("bg-[var(--button-bg)]");

            rerender(<Button variant="destructive">Destructive</Button>);
            button = getByRole("button", { name: /destructive/i });
            expect(button).toHaveClass("bg-destructive");

            rerender(<Button variant="outline">Outline</Button>);
            button = getByRole("button", { name: /outline/i });
            expect(button).toHaveClass("border");

            rerender(<Button variant="secondary">Secondary</Button>);
            button = getByRole("button", { name: /secondary/i });
            expect(button).toHaveClass("bg-secondary");

            rerender(<Button variant="ghost">Ghost</Button>);
            button = getByRole("button", { name: /ghost/i });
            expect(button).toHaveClass("hover:bg-accent");

            rerender(<Button variant="link">Link</Button>);
            button = getByRole("button", { name: /link/i });
            expect(button).toHaveClass("text-primary", "underline-offset-4");
        });

        it("应该渲染不同尺寸的按钮", () => {
            const { rerender } = customRender(<Button size="default">Default</Button>);

            let button = getByRole("button", { name: /default/i });
            expect(button).toHaveClass("h-9");

            rerender(<Button size="sm">Small</Button>);
            button = getByRole("button", { name: /small/i });
            expect(button).toHaveClass("h-8");

            rerender(<Button size="lg">Large</Button>);
            button = getByRole("button", { name: /large/i });
            expect(button).toHaveClass("h-10");

            rerender(<Button size="icon">Icon</Button>);
            button = getByRole("button", { name: /icon/i });
            expect(button).toHaveClass("size-9");
        });
    });

    describe("子组件测试", () => {
        it("应该支持图标子组件", () => {
            customRender(
                <MockButton>
                    <span data-testid="icon">🔥</span>
                    Button with Icon
                </MockButton>
            );

            const icon = document.querySelector('[data-testid="icon"]');
            expect(icon).toBeInTheDocument();

            const button = getByRole("button", { name: /button with icon/i });
            expect(button).toBeInTheDocument();
        });

        it("应该支持复杂子组件结构", () => {
            customRender(
                <MockButton>
                    <div className="flex items-center gap-2">
                        <span data-testid="left-icon">→</span>
                        <span>Complex Button</span>
                        <span data-testid="right-icon">←</span>
                    </div>
                </MockButton>
            );

            const leftIcon = document.querySelector('[data-testid="left-icon"]');
            const rightIcon = document.querySelector('[data-testid="right-icon"]');

            expect(leftIcon).toBeInTheDocument();
            expect(rightIcon).toBeInTheDocument();

            const button = getByRole("button", { name: /complex button/i });
            expect(button).toBeInTheDocument();
        });
    });

    describe("事件处理测试", () => {
        it("应该正确处理鼠标事件", async () => {
            const mockMouseEnter = vi.fn();
            const mockMouseLeave = vi.fn();

            customRender(
                <MockButton
                    onMouseEnter={mockMouseEnter}
                    onMouseLeave={mockMouseLeave}
                >
                    Hover Button
                </MockButton>
            );

            const button = getByRole("button", { name: /hover button/i });

            await user.hover(button);
            expect(mockMouseEnter).toHaveBeenCalledTimes(1);

            await user.unhover(button);
            expect(mockMouseLeave).toHaveBeenCalledTimes(1);
        });

        it("应该正确处理焦点事件", async () => {
            const mockFocus = vi.fn();
            const mockBlur = vi.fn();

            customRender(
                <MockButton
                    onFocus={mockFocus}
                    onBlur={mockBlur}
                >
                    Focus Button
                </MockButton>
            );

            const button = getByRole("button", { name: /focus button/i });

            button.focus();
            expect(mockFocus).toHaveBeenCalledTimes(1);

            button.blur();
            expect(mockBlur).toHaveBeenCalledTimes(1);
        });
    });
});