"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function Accordion({
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return (
        <AccordionPrimitive.Root
            data-slot="accordion"
            className={cn(
                // 基础布局和动画
                "fade-in grid gap-[var(--token-spacing-1)]",
                "transition-[color,background-color,border-color,box-shadow] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                props.className
            )}
            {...props}
        />
    );
}

const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            ref={ref}
            className={cn(
                // 使用设计令牌的边框
                "border-b border-[var(--color-border)] last:border-b-0",
                // 背景和圆角
                "bg-[var(--color-background)] rounded-[var(--token-radius-card,var(--token-radius-md))]",
                // 阴影和微交互
                "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]",
                // 过渡动画
                "color-transition transition-[background-color,border-color,box-shadow] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 内边距
                "p-[var(--token-spacing-1)] -mx-[var(--token-spacing-1)]",
                className
            )}
            {...props}
        />
    );
});
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Header
            data-slot="accordion-header"
            className="flex"
        >
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                ref={ref}
                className={cn(
                    // 基础交互类
                    "interactive-base w-full",
                    // 布局系统
                    "flex flex-1 items-center justify-between gap-[var(--token-spacing-3)]",
                    // 内边距
                    "py-[var(--token-spacing-3)] px-[var(--token-spacing-4)]",
                    // 圆角
                    "rounded-[var(--token-radius-button,var(--token-radius-md))]",
                    // 排版令牌
                    "text-[var(--token-text-sm)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)] text-left",
                    // 状态样式 - 使用设计令牌
                    "data-[state=open]:text-[var(--color-foreground)] data-[state=closed]:text-[var(--color-muted-foreground)]",
                    "hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)]/30",
                    // 焦点状态
                    "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                    // 微交互动画
                    "scale-active transition-[color,background-color,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 渐入动画
                    "fade-in",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDownIcon
                    className={cn(
                        // 图标样式
                        "size-4 shrink-0 transition-transform duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                        // 旋转动画
                        "data-[state=open]:rotate-180 data-[state=closed]:rotate-0",
                        // 颜色过渡
                        "color-transition transition-[color,transform]",
                        "text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]"
                    )}
                />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            ref={ref}
            className={cn(
                // 网格动画系统 - 更平滑的展开/收起
                "grid overflow-hidden",
                "transition-[grid-template-rows,opacity,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 状态动画
                "data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]",
                "data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
                // 微交互
                "data-[state=open]:scale-[1] data-[state=closed]:scale-[0.98]",
                // 过渡动画
                "color-transition",
                className
            )}
            {...props}
        >
            <div className={cn(
                // 内容容器样式
                "overflow-hidden",
                // 内边距令牌
                "pb-[var(--token-spacing-4)] pt-[var(--token-spacing-2)] px-[var(--token-spacing-4)]",
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                // 颜色令牌
                "text-[var(--color-foreground)]",
                // 渐入动画
                "fade-in"
            )}>
                {children}
            </div>
        </AccordionPrimitive.Content>
    );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };