"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, orientation = "vertical", ...props }, ref) => {
    const layoutClassName =
        orientation === "horizontal"
            ? "flex flex-wrap items-center gap-[var(--token-spacing-4)]"
            : "grid gap-[var(--token-spacing-3)]";

    return (
        <RadioGroupPrimitive.Root
            data-slot="radio-group"
            ref={ref}
            orientation={orientation}
            className={cn(
                // 基础布局
                layoutClassName,
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioGroupItemProps = React.ComponentPropsWithoutRef<
    typeof RadioGroupPrimitive.Item
> & {
    label?: React.ReactNode;
};

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    RadioGroupItemProps
>(({ className, children, label, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const itemId = id ?? generatedId;
    const labelContent = children ?? label;
    const isDisabled = Boolean(disabled);

    return (
        <div
            data-slot="radio-group-item-wrapper"
            className={cn(
                // 基础布局
                "inline-flex items-center gap-[var(--token-spacing-2)]",
                // 禁用状态
                isDisabled && "cursor-not-allowed opacity-60",
                !isDisabled && "cursor-pointer",
                // 渐入动画
                "fade-in",
                // 过渡动画
                "color-transition transition-[color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            )}
        >
            <RadioGroupPrimitive.Item
                data-slot="radio-group-item"
                ref={ref}
                id={itemId}
                disabled={disabled}
                className={cn(
                    // 基础交互类
                    "form-control-base scale-active",
                    // 尺寸和形状
                    "size-4 rounded-full border-2",
                    // 边框和背景色令牌
                    "border-[var(--color-border,var(--color-input,var(--color-muted-foreground)/20))] bg-[var(--color-background)]",
                    // 阴影
                    "shadow-[var(--shadow-xs)]",
                    // 选中状态
                    "data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)]",
                    "data-[state=checked]:shadow-[var(--shadow-button)]",
                    // 焦点状态
                    "focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))]",
                    "focus-visible:ring-[var(--token-focus-ring-width,2px)]",
                    "focus-visible:ring-offset-[var(--color-background)]",
                    "focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)]",
                    // 过渡动画
                    "transition-[border-color,background-color,box-shadow,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 禁用状态
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    // 渐入动画
                    "fade-in",
                    className,
                )}
                {...props}
            >
                <RadioGroupPrimitive.Indicator
                    data-slot="radio-group-indicator"
                    className={cn(
                        // 指示器布局
                        "flex size-full items-center justify-center",
                        // 渐入动画
                        "fade-in",
                    )}
                >
                    <span
                        className={cn(
                            // 指示器样式
                            "size-2.5 rounded-full bg-[var(--color-primary-foreground,var(--color-background))]",
                            // 动画
                            "scale-active transition-transform duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                            // 渐入动画
                            "fade-in",
                        )}
                    />
                </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            {labelContent && (
                <label
                    data-slot="radio-group-label"
                    htmlFor={itemId}
                    className={cn(
                        // 排版令牌
                        "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                        // 颜色令牌
                        "text-[var(--color-foreground)]",
                        // 禁用状态
                        isDisabled && "cursor-not-allowed opacity-60",
                        !isDisabled && "cursor-pointer",
                        // 过渡动画
                        "color-transition transition-[color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                        // 微交互
                        !isDisabled &&
                            "hover:text-[var(--color-foreground)]/80",
                        // 渐入动画
                        "fade-in",
                    )}
                >
                    {labelContent}
                </label>
            )}
        </div>
    );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
