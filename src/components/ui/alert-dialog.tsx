"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AlertDialogRootProps = React.ComponentPropsWithoutRef<
    typeof AlertDialogPrimitive.Root
>;

function AlertDialog({ ...props }: AlertDialogRootProps) {
    return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
    return (
        <AlertDialogPrimitive.Trigger
            data-slot="alert-dialog-trigger"
            className={cn(
                // 基础交互类
                "interactive-base scale-active",
                props.className,
            )}
            {...props}
        />
    );
}

function AlertDialogPortal({
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
    return (
        <AlertDialogPrimitive.Portal
            data-slot="alert-dialog-portal"
            {...props}
        />
    );
}

function AlertDialogOverlay({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
    return (
        <AlertDialogPrimitive.Overlay
            data-slot="alert-dialog-overlay"
            className={cn(
                // 基础覆盖层样式
                "fixed inset-0 z-[var(--z-modal,50)]",
                // 背景色令牌 - 警告对话框使用更深的背景
                "bg-[var(--color-overlay,rgba(0,0,0,0.6))]",
                // 背景模糊效果
                "backdrop-blur-sm",
                // 进场和出场动画
                "data-[state=closed]:animate-out data-[state=open]:animate-in",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                // 过渡动画
                "transition-[opacity,backdrop-filter] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogContent({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogPrimitive.Content
                data-slot="alert-dialog-content"
                className={cn(
                    // 基础定位和布局
                    "fixed top-[50%] left-[50%] z-[var(--z-modal,50)]",
                    // 响应式宽度和最大宽度 - 警告对话框稍大
                    "grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
                    "sm:max-w-xl",
                    // 内边距令牌
                    "p-[var(--token-spacing-6)]",
                    // 背景色和圆角令牌
                    "rounded-[var(--token-radius-card,var(--token-radius-lg))] bg-[var(--color-background)]",
                    // 边框和阴影令牌 - 警告对话框使用更强的阴影
                    "border border-[var(--color-destructive,var(--color-muted-foreground)/20)] shadow-[var(--shadow-2xl)]",
                    // 进场和出场动画
                    "data-[state=closed]:animate-out data-[state=open]:animate-in",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
                    // 过渡动画
                    "transition-[all,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 渐入动画
                    "fade-in",
                    // 微交互
                    "data-[state=closed]:scale-[0.95] data-[state=open]:scale-[1]",
                    className,
                )}
                {...props}
            />
        </AlertDialogPortal>
    );
}

function AlertDialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn(
                // 基础布局
                "flex flex-col gap-[var(--token-spacing-3)]",
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

function AlertDialogFooter({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-footer"
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

function AlertDialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
    return (
        <AlertDialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn(
                // 排版令牌
                "font-[var(--token-font-weight-semibold)] text-[var(--token-text-lg)] leading-[var(--token-line-height-tight)]",
                // 颜色令牌 - 警告对话框标题使用警告色
                "text-[var(--color-destructive-foreground,var(--color-foreground))]",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
    return (
        <AlertDialogPrimitive.Description
            data-slot="alert-dialog-description"
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

function AlertDialogAction({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
    return (
        <AlertDialogPrimitive.Action
            className={cn(
                buttonVariants(),
                // 警告对话框操作按钮默认使用destructive变体
                buttonVariants({ variant: "destructive" }),
                // 微交互
                "scale-active",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

function AlertDialogCancel({
    className,
    ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
    return (
        <AlertDialogPrimitive.Cancel
            className={cn(
                buttonVariants({ variant: "outline" }),
                // 微交互
                "scale-active",
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
