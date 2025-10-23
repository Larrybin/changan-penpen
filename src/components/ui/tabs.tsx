"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn(
                // 基础布局和动画
                "fade-in grid gap-[var(--token-spacing-6)]",
                "transition-[color,background-color,border-color,box-shadow] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                props.className
            )}
            {...props}
        />
    );
}

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            ref={ref}
            className={cn(
                // 统一背景和布局令牌
                "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
                // 现代圆角和间距令牌
                "rounded-[var(--token-radius-card)] p-[var(--token-spacing-1)]",
                // 布局系统
                "inline-flex h-[calc(var(--token-height-button)+var(--token-spacing-2))] items-center justify-center gap-[var(--token-spacing-1)]",
                // 边框和阴影
                "border border-[var(--color-border,transparent)] shadow-[var(--shadow-sm)]",
                // 过渡动画
                "color-transition transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 微交互
                "hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border,var(--color-muted-foreground)/20)]",
                className
            )}
            {...props}
        />
    );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            ref={ref}
            className={cn(
                // 基础交互类 - 使用我们的统一系统
                "interactive-base",
                // 标签页特定样式
                "inline-flex items-center justify-center gap-[var(--token-spacing-2)] whitespace-nowrap px-[var(--token-spacing-4)] py-[var(--token-spacing-2)]",
                // 圆角令牌
                "rounded-[var(--token-radius-button,var(--token-radius-md))]",
                // 排版令牌
                "text-[var(--token-text-sm)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)]",
                // 状态样式 - 使用设计令牌
                "data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow-[var(--shadow-button)]",
                "data-[state=inactive]:text-[var(--color-muted-foreground)] data-[state=inactive]:hover:text-[var(--color-foreground)] data-[state=inactive]:hover:bg-[var(--color-accent)]/50",
                // 焦点状态
                "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                // 微交互动画
                "scale-active transition-[background-color,color,box-shadow,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 禁用状态
                "disabled:pointer-events-none disabled:opacity-50",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            ref={ref}
            className={cn(
                // 基础动画
                "fade-in",
                "mt-[var(--token-spacing-4)] focus-visible:outline-none",
                // 焦点环样式
                "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                // 过渡动画
                "color-transition transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 微交互
                "data-[state=active]:scale-[1.02] data-[state=active]:shadow-[var(--shadow-sm)]",
                className
            )}
            {...props}
        />
    );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };