"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({
    className,
    ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                // 基础布局
                "flex items-center gap-[var(--token-spacing-2)]",
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-tight)] font-[var(--token-font-weight-medium)]",
                // 用户选择
                "select-none",
                // 焦点样式
                "focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)] rounded-[var(--token-radius-sm)]",
                // 过渡动画
                "color-transition transition-[color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                // 颜色令牌
                "text-[var(--color-foreground)]",
                // 禁用状态
                "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                // 渐入动画
                "fade-in",
                // 微交互
                "hover:text-[var(--color-foreground)]/80",
                className
            )}
            {...props}
        />
    );
}

export { Label };