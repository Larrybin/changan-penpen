"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as React from "react";

import { cn } from "@/lib/utils";

function Collapsible({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return (
        <CollapsiblePrimitive.Root
            data-slot="collapsible"
            className={cn(
                // 基础动画类
                "fade-in",
                props.className
            )}
            {...props}
        />
    );
}

function CollapsibleTrigger({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
    return (
        <CollapsiblePrimitive.Trigger
            data-slot="collapsible-trigger"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                // 过渡动画
                "transition-[color,background-color,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 焦点状态
                "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)] rounded-[var(--token-radius-sm)]",
                // 渐入动画
                "fade-in",
                props.className
            )}
            {...props}
        />
    );
}

const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => {
    return (
        <CollapsiblePrimitive.Content
            data-slot="collapsible-content"
            ref={ref}
            className={cn(
                // 网格动画系统 - 平滑展开/收起
                "grid overflow-hidden",
                // 过渡动画
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
                "min-h-0 overflow-hidden",
                // 渐入动画
                "fade-in"
            )}>
                {children}
            </div>
        </CollapsiblePrimitive.Content>
    );
});
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };