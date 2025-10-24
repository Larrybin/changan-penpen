"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            data-slot="separator"
            decorative={decorative}
            orientation={orientation}
            className={cn(
                // 基础样式
                "shrink-0",
                // 背景色令牌
                "bg-[var(--color-border,var(--color-muted-foreground)/15)]",
                // 方向样式
                "data-[orientation=horizontal]:h-[1px] data-[orientation=horizontal]:w-full",
                "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-[1px]",
                // 渐入动画
                "fade-in",
                // 过渡动画
                "color-transition transition-[background-color,color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                // 微交互
                "hover:bg-[var(--color-border,var(--color-muted-foreground)/25)]",
                className,
            )}
            {...props}
        />
    );
}

export { Separator };
