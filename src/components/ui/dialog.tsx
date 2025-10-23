"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

type DialogRootProps = React.ComponentPropsWithoutRef<
    typeof DialogPrimitive.Root
>;

function Dialog({ ...props }: DialogRootProps) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return (
        <DialogPrimitive.Trigger
            data-slot="dialog-trigger"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                props.className,
            )}
            {...props}
        />
    );
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return (
        <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                props.className,
            )}
            {...props}
        />
    );
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                // 基础覆盖层样式
                "fixed inset-0 z-[var(--z-modal,50)]",
                // 背景色令牌
                "bg-[var(--color-overlay,rgba(0,0,0,0.5))]",
                // 背景模糊效果
                "backdrop-blur-sm",
                // 进场和出场动画
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                // 过渡动画
                "transition-[opacity,backdrop-filter] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={cn(
                    // 基础定位和布局
                    "fixed top-[50%] left-[50%] z-[var(--z-modal,50)]",
                    // 响应式宽度和最大宽度
                    "grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
                    "sm:max-w-lg",
                    // 内边距令牌
                    "p-[var(--token-spacing-6)]",
                    // 背景色和圆角令牌
                    "bg-[var(--color-background)] rounded-[var(--token-radius-card,var(--token-radius-lg))]",
                    // 边框和阴影令牌
                    "border border-[var(--color-border,var(--color-muted-foreground)/10)] shadow-[var(--shadow-xl)]",
                    // 进场和出场动画
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
                    // 过渡动画
                    "transition-[all,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 渐入动画
                    "fade-in",
                    // 微交互
                    "data-[state=open]:scale-[1] data-[state=closed]:scale-[0.95]",
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className={cn(
                            // 基础交互类
                            "interactive-base scale-active",
                            // 定位样式
                            "absolute top-[var(--token-spacing-4)] right-[var(--token-spacing-4)]",
                            // 尺寸和圆角
                            "size-8 rounded-[var(--token-radius-button,var(--token-radius-md))]",
                            // 背景和颜色
                            "bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)]/70",
                            // 悬停状态
                            "hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]",
                            // 焦点状态
                            "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)]",
                            // 过渡动画
                            "color-transition transition-[background-color,color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                            // 禁用状态
                            "disabled:pointer-events-none disabled:opacity-50",
                            // 图标样式
                            "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
                        )}
                    >
                        <XIcon />
                        <span className="sr-only">关闭</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn(
                // 基础布局
                "flex flex-col gap-[var(--token-spacing-2)]",
                // 文本对齐
                "text-center sm:text-left",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                // 响应式布局
                "flex flex-col-reverse gap-[var(--token-spacing-3)]",
                "sm:flex-row sm:justify-end sm:gap-[var(--token-spacing-2)]",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                // 排版令牌
                "text-[var(--token-text-lg)] font-[var(--token-font-weight-semibold)] leading-[var(--token-line-height-tight)]",
                // 颜色令牌
                "text-[var(--color-foreground)]",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn(
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                // 颜色令牌
                "text-[var(--color-muted-foreground)]",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
