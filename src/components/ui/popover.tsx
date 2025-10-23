"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

function Popover({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
    return (
        <PopoverPrimitive.Root
            data-slot="popover"
            className={cn(
                // 基础动画类
                "fade-in",
                props.className
            )}
            {...props}
        />
    );
}

function PopoverTrigger({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
    return (
        <PopoverPrimitive.Trigger
            data-slot="popover-trigger"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                props.className
            )}
            {...props}
        />
    );
}

function PopoverAnchor({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
    return (
        <PopoverPrimitive.Anchor
            data-slot="popover-anchor"
            {...props}
        />
    );
}

function PopoverClose({
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
    return (
        <PopoverPrimitive.Close
            data-slot="popover-close"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                props.className
            )}
            {...props}
        />
    );
}

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                data-slot="popover-content"
                ref={ref}
                align={align}
                sideOffset={sideOffset}
                className={cn(
                    // 层级和定位
                    "z-[var(--z-dropdown,40)]",
                    // 最小宽度
                    "min-w-[var(--popover-min-width,12rem)]",
                    // 圆角令牌
                    "rounded-[var(--token-radius-card,var(--token-radius-md))]",
                    // 背景色和边框令牌
                    "bg-[var(--color-popover,var(--color-background))] border border-[var(--color-border,var(--color-muted-foreground)/10)]",
                    // 内边距令牌
                    "p-[var(--token-spacing-4)]",
                    // 文字颜色令牌
                    "text-[var(--color-popover-foreground,var(--color-foreground))]",
                    // 阴影令牌
                    "shadow-[var(--shadow-lg)]",
                    // 焦点样式
                    "focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                    // 进场和出场动画
                    "data-[state=closed]:animate-out data-[state=open]:animate-in",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    // 方向动画
                    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                    // 过渡动画
                    "transition-[all,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 渐入动画
                    "fade-in",
                    // 微交互
                    "data-[state=open]:scale-[1] data-[state=closed]:scale-[0.95]",
                    // 边距处理
                    "outline-none",
                    className
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger };