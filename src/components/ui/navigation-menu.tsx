"use client";

import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
        ref={ref}
        data-slot="navigation-menu"
        className={cn(
            // 基础定位和层级
            "relative z-[var(--z-dropdown,40)]",
            // 布局
            "flex max-w-max flex-1 justify-center",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List
        ref={ref}
        data-slot="navigation-menu-list"
        className={cn(
            // 基础布局
            "group flex flex-1 list-none items-center justify-center",
            // 间距令牌
            "gap-[var(--token-spacing-1)]",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

function NavigationMenuItem({
    className,
    ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
    return (
        <NavigationMenuPrimitive.Item
            data-slot="navigation-menu-item"
            className={cn(
                // 渐入动画
                "fade-in",
                className,
            )}
            {...props}
        />
    );
}

const navigationMenuTriggerClasses =
    // 基础交互类
    "interactive-base scale-active " +
    // 布局和尺寸
    "group inline-flex h-[calc(var(--token-height-button,var(--token-height-10)))] w-max items-center gap-[var(--token-spacing-2)] justify-center " +
    // 圆角和内边距
    "rounded-[var(--token-radius-button,var(--token-radius-md))] px-[var(--token-spacing-4)] py-[var(--token-spacing-2)] " +
    // 排版令牌
    "text-[var(--token-text-sm)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)] " +
    // 过渡动画
    "transition-[color,background-color,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)] " +
    // 焦点状态
    "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)] " +
    // 禁用状态
    "disabled:pointer-events-none disabled:opacity-50 " +
    // 状态样式
    "data-[state=open]:bg-[var(--color-accent)] data-[state=open]:text-[var(--color-accent-foreground)] " +
    "hover:bg-[var(--color-accent)]/80 hover:text-[var(--color-accent-foreground)]";

const NavigationMenuTrigger = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Trigger
        ref={ref}
        data-slot="navigation-menu-trigger"
        className={cn(
            // 背景色
            "bg-transparent",
            // 统一触发器样式
            navigationMenuTriggerClasses,
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    >
        {children}
        <ChevronDownIcon
            aria-hidden
            className={cn(
                // 图标样式
                "size-4 shrink-0",
                // 过渡动画
                "transition-transform duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 状态动画
                "group-data-[state=closed]:rotate-0 group-data-[state=open]:rotate-180",
                // 颜色
                "text-[var(--color-muted-foreground)]/60",
            )}
        />
    </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuLink = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Link>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Link
        ref={ref}
        data-slot="navigation-menu-link"
        className={cn(
            // 背景色
            "bg-transparent",
            // 统一触发器样式
            navigationMenuTriggerClasses,
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

const NavigationMenuContent = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Content
        ref={ref}
        data-slot="navigation-menu-content"
        className={cn(
            // 定位和布局
            "top-0 left-0 w-full origin-[var(--radix-navigation-menu-content-transform-origin)]",
            // 圆角令牌
            "rounded-[var(--token-radius-card,var(--token-radius-md))]",
            // 背景色和边框
            "border border-[var(--color-border,var(--color-muted-foreground)/10)] bg-[var(--color-popover,var(--color-background))]",
            // 内边距令牌
            "p-[var(--token-spacing-6)]",
            // 文字颜色
            "text-[var(--color-popover-foreground,var(--color-foreground))]",
            // 阴影令牌
            "shadow-[var(--shadow-lg)]",
            // 进场和出场动画
            "data-[motion=from-end]:animate-in data-[motion=from-start]:animate-in",
            "data-[motion=from-end]:fade-in-0 data-[motion=from-end]:slide-in-from-right-4",
            "data-[motion=from-start]:fade-in-0 data-[motion=from-start]:slide-in-from-left-4",
            "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
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
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuViewport = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
    <div
        className={cn(
            // 绝对定位和居中
            "-translate-x-1/2 absolute top-full left-1/2 flex w-full justify-center",
            // 渐入动画
            "fade-in",
        )}
    >
        <NavigationMenuPrimitive.Viewport
            ref={ref}
            data-slot="navigation-menu-viewport"
            className={cn(
                // 相对定位和层级
                "relative z-[var(--z-dropdown,40)]",
                // 尺寸令牌
                "h-[var(--radix-navigation-menu-viewport-height)] w-full min-w-[var(--radix-navigation-menu-viewport-width)]",
                // 圆角和溢出
                "overflow-hidden rounded-[var(--token-radius-card,var(--token-radius-md))]",
                // 背景色和边框
                "border border-[var(--color-border,var(--color-muted-foreground)/10)] bg-[var(--color-popover,var(--color-background))]",
                // 阴影令牌
                "shadow-[var(--shadow-lg)]",
                // 过渡动画
                "transition-[width,height,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 进场和出场动画
                "data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
                "data-[state=open]:zoom-in-95 data-[state=open]:animate-in",
                // 微交互
                "data-[state=closed]:scale-[0.95] data-[state=open]:scale-[1]",
                className,
            )}
            {...props}
        />
    </div>
));
NavigationMenuViewport.displayName =
    NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Indicator
        ref={ref}
        data-slot="navigation-menu-indicator"
        className={cn(
            // 定位和层级
            "top-full z-[var(--z-dropdown,40)] flex h-[6px] items-end justify-center overflow-hidden",
            // 过渡动画
            "transition-[width,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            // 进场和出场动画
            "data-[state=visible]:fade-in-0 data-[state=visible]:animate-in",
            "data-[state=hidden]:fade-out-0 data-[state=hidden]:animate-out",
            className,
        )}
        {...props}
    >
        <div
            className={cn(
                // 相对定位和样式
                "relative top-[60%] h-2 w-2 rotate-45",
                // 圆角
                "rounded-tl-[var(--token-radius-xs,2px)]",
                // 背景色和阴影
                "bg-[var(--color-border,var(--color-muted-foreground)/30)] shadow-[var(--shadow-sm)]",
                // 渐入动画
                "fade-in",
            )}
        />
    </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
    NavigationMenuPrimitive.Indicator.displayName;

function NavigationMenuSub({
    ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Sub>) {
    return (
        <NavigationMenuPrimitive.Sub
            data-slot="navigation-menu-sub"
            className={cn(
                // 渐入动画
                "fade-in",
                props.className,
            )}
            {...props}
        />
    );
}

export {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuSub,
    NavigationMenuTrigger,
    NavigationMenuViewport,
};
