"use client";

import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Menubar = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Root
        ref={ref}
        data-slot="menubar"
        className={cn(
            // 基础布局
            "flex items-center gap-[var(--token-spacing-1)]",
            // 高度令牌
            "h-[calc(var(--token-height-button,var(--token-height-10)))]",
            // 圆角令牌
            "rounded-[var(--token-radius-card,var(--token-radius-md))]",
            // 背景色和边框令牌
            "border",
            "border-[var(--color-border,var(--color-muted-foreground)/10)]",
            "bg-[var(--color-background)]",
            // 内边距令牌
            "p-[var(--token-spacing-1)]",
            // 阴影令牌
            "shadow-[var(--shadow-sm)]",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

type MenubarMenuProps = React.ComponentPropsWithoutRef<
    typeof MenubarPrimitive.Menu
>;

function MenubarMenu({ ...props }: MenubarMenuProps) {
    return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

const MenubarTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Trigger
        ref={ref}
        data-slot="menubar-trigger"
        className={cn(
            // 基础交互类
            "interactive-base",
            "scale-active",
            // 布局和尺寸
            "inline-flex",
            "items-center",
            "justify-center",
            "gap-[var(--token-spacing-2)]",
            // 最小宽度和高度
            "h-8",
            "min-w-[2.5rem]",
            // 圆角和内边距令牌
            "rounded-[var(--token-radius-button,var(--token-radius-md))]",
            "px-[calc(var(--token-spacing-3)*0.75)]",
            "py-[var(--token-spacing-1)]",
            // 排版令牌
            "font-[var(--token-font-weight-medium)]",
            "text-[var(--token-text-sm)]",
            "leading-[var(--token-line-height-tight)]",
            // 过渡动画
            "transition-[color,background-color,transform]",
            "duration-[var(--token-motion-duration-normal)]",
            "ease-[var(--token-motion-ease-standard)]",
            // 焦点状态
            "focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))]",
            "focus-visible:ring-[var(--token-focus-ring-width,2px)]",
            "focus-visible:ring-offset-[var(--color-background)]",
            "focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)]",
            // 状态样式
            "data-[state=open]:bg-[var(--color-accent)]/70",
            "data-[state=open]:text-[var(--color-accent-foreground)]",
            "hover:bg-[var(--color-accent)]",
            "hover:text-[var(--color-accent-foreground)]",
            // 禁用状态
            "disabled:pointer-events-none",
            "disabled:opacity-50",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
    <MenubarPrimitive.SubTrigger
        ref={ref}
        data-slot="menubar-sub-trigger"
        className={cn(
            // 基础交互类
            "interactive-base",
            "scale-active",
            // 布局和样式
            "flex",
            "cursor-default",
            "select-none",
            "items-center",
            "gap-[var(--token-spacing-2)]",
            // 圆角和内边距令牌
            "rounded-[var(--token-radius-button,var(--token-radius-sm))]",
            "px-[var(--token-spacing-3)]",
            "py-[var(--token-spacing-2)]",
            // 排版令牌
            "text-[var(--token-text-sm)]",
            "leading-[var(--token-line-height-normal)]",
            // 焦点状态
            "focus-visible:bg-[var(--color-accent)]",
            "focus-visible:text-[var(--color-accent-foreground)]",
            // 状态样式
            "data-[state=open]:bg-[var(--color-accent)]/70",
            "data-[state=open]:text-[var(--color-accent-foreground)]",
            // 过渡动画
            "color-transition",
            "transition-[color,background-color,transform]",
            "duration-[var(--token-motion-duration-fast)]",
            "ease-[var(--token-motion-ease-standard)]",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    >
        {children}
        <ChevronRightIcon
            className={cn(
                // 图标样式
                "ml-auto",
                "size-4",
                "shrink-0",
                // 过渡动画
                "transition-transform duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                // 颜色
                "text-[var(--color-muted-foreground)]/60",
            )}
        />
    </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.SubContent
        ref={ref}
        data-slot="menubar-sub-content"
        className={cn(
            // 基础样式
            "min-w-[12rem]",
            // 圆角令牌
            "rounded-[var(--token-radius-card,var(--token-radius-md))]",
            // 背景色和边框令牌
            "border",
            "border-[var(--color-border,var(--color-muted-foreground)/10)]",
            "bg-[var(--color-popover,var(--color-background))]",
            // 内边距令牌
            "p-[var(--token-spacing-1)]",
            // 文字颜色令牌
            "text-[var(--color-popover-foreground,var(--color-foreground))]",
            // 阴影令牌
            "shadow-[var(--shadow-lg)]",
            // 进场和出场动画
            "data-[state=closed]:animate-out",
            "data-[state=open]:animate-in",
            "data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95",
            "data-[state=open]:zoom-in-95",
            // 过渡动画
            "transition-[all,transform]",
            "duration-[var(--token-motion-duration-normal)]",
            "ease-[var(--token-motion-ease-standard)]",
            // 渐入动画
            "fade-in",
            // 微交互
            "data-[state=closed]:scale-[0.95]",
            "data-[state=open]:scale-[1]",
            className,
        )}
        {...props}
    />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (
    <MenubarPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        data-slot="menubar-content"
        className={cn(
            // 层级和基础样式
            "z-[var(--z-dropdown,40)]",
            "min-w-[12rem]",
            "overflow-hidden",
            // 圆角令牌
            "rounded-[var(--token-radius-card,var(--token-radius-md))]",
            // 背景色和边框令牌
            "border",
            "border-[var(--color-border,var(--color-muted-foreground)/10)]",
            "bg-[var(--color-popover,var(--color-background))]",
            // 内边距令牌
            "p-[var(--token-spacing-1)]",
            // 文字颜色令牌
            "text-[var(--color-popover-foreground,var(--color-foreground))]",
            // 阴影令牌
            "shadow-[var(--shadow-lg)]",
            // 进场和出场动画
            "data-[state=closed]:animate-out",
            "data-[state=open]:animate-in",
            "data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95",
            "data-[state=open]:zoom-in-95",
            // 方向动画
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            // 过渡动画
            "transition-[all,transform]",
            "duration-[var(--token-motion-duration-normal)]",
            "ease-[var(--token-motion-ease-standard)]",
            // 渐入动画
            "fade-in",
            // 微交互
            "data-[state=closed]:scale-[0.95]",
            "data-[state=open]:scale-[1]",
            className,
        )}
        {...props}
    />
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Item
        ref={ref}
        data-slot="menubar-item"
        className={cn(
            // 基础交互类
            "interactive-base",
            "scale-active",
            // 布局和样式
            "relative",
            "flex",
            "cursor-default",
            "select-none",
            "items-center",
            "gap-[var(--token-spacing-2)]",
            // 圆角和内边距令牌
            "rounded-[var(--token-radius-button,var(--token-radius-sm))]",
            "px-[var(--token-spacing-3)]",
            "py-[var(--token-spacing-2)]",
            // 排版令牌
            "text-[var(--token-text-sm)]",
            "leading-[var(--token-line-height-normal)]",
            // 焦点状态
            "focus-visible:bg-[var(--color-accent)]",
            "focus-visible:text-[var(--color-accent-foreground)]",
            // 过渡动画
            "color-transition",
            "transition-[color,background-color,transform]",
            "duration-[var(--token-motion-duration-fast)]",
            "ease-[var(--token-motion-ease-standard)]",
            // 禁用状态
            "data-[disabled]:pointer-events-none",
            "data-[disabled]:opacity-50",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <MenubarPrimitive.CheckboxItem
        ref={ref}
        data-slot="menubar-checkbox-item"
        className={cn(
            // 基础交互类
            "interactive-base scale-active",
            // 布局和样式
            "relative flex cursor-default select-none items-center gap-[var(--token-spacing-2)]",
            // 圆角和内边距令牌
            "rounded-[var(--token-radius-button,var(--token-radius-sm))] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)]",
            // 排版令牌
            "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
            // 焦点状态
            "focus-visible:bg-[var(--color-accent)] focus-visible:text-[var(--color-accent-foreground)]",
            // 过渡动画
            "color-transition transition-[color,background-color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            // 禁用状态
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            // 渐入动画
            "fade-in",
            className,
        )}
        checked={checked}
        {...props}
    >
        <span
            className={cn(
                // 选中指示器位置
                "absolute left-[var(--token-spacing-2)] inline-flex size-4 items-center justify-center",
                // 渐入动画
                "fade-in",
            )}
        >
            <MenubarPrimitive.ItemIndicator>
                <CheckIcon
                    className={cn(
                        // 图标样式
                        "size-4 text-[var(--color-primary)]",
                        // 动画
                        "scale-active transition-transform duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                    )}
                />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioGroup = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.RadioGroup>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.RadioGroup
        ref={ref}
        data-slot="menubar-radio-group"
        className={cn(
            // 基础布局
            "grid gap-[var(--token-spacing-1)]",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
MenubarRadioGroup.displayName = MenubarPrimitive.RadioGroup.displayName;

const MenubarRadioItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <MenubarPrimitive.RadioItem
        ref={ref}
        data-slot="menubar-radio-item"
        className={cn(
            // 基础交互类
            "interactive-base scale-active",
            // 布局和样式
            "relative flex cursor-default select-none items-center gap-[var(--token-spacing-2)]",
            // 圆角和内边距令牌
            "rounded-[var(--token-radius-button,var(--token-radius-sm))] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)]",
            // 排版令牌
            "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
            // 焦点状态
            "focus-visible:bg-[var(--color-accent)] focus-visible:text-[var(--color-accent-foreground)]",
            // 过渡动画
            "color-transition transition-[color,background-color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            // 禁用状态
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    >
        <span
            className={cn(
                // 选中指示器位置
                "absolute left-[var(--token-spacing-2)] inline-flex size-4 items-center justify-center",
                // 渐入动画
                "fade-in",
            )}
        >
            <MenubarPrimitive.ItemIndicator>
                <CircleIcon
                    className={cn(
                        // 图标样式
                        "size-2.5 fill-current text-[var(--color-primary)]",
                        // 动画
                        "scale-active transition-transform duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                    )}
                />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarLabel = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
        inset?: boolean;
    }
>(({ className, inset = false, ...props }, ref) => (
    <MenubarPrimitive.Label
        ref={ref}
        data-slot="menubar-label"
        className={cn(
            // 内边距令牌
            "px-[var(--token-spacing-3)] py-[var(--token-spacing-2)]",
            // 排版令牌
            "font-[var(--token-font-weight-semibold)]",
            "text-[var(--token-text-xs)]",
            "uppercase",
            "leading-[var(--token-line-height-tight)]",
            "tracking-[0.05em]",
            // 颜色令牌
            "text-[var(--color-muted-foreground)]",
            // 缩进样式
            inset && "pl-[calc(var(--token-spacing-3)*2)]",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarSeparator = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Separator
        ref={ref}
        data-slot="menubar-separator"
        className={cn(
            // 分割线样式
            "-mx-[var(--token-spacing-1)] my-[var(--token-spacing-1)] h-[1px]",
            // 背景色令牌
            "bg-[var(--color-border,var(--color-muted-foreground)/10)]",
            // 渐入动画
            "fade-in",
            // 过渡动画
            "color-transition transition-[background-color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
            className,
        )}
        {...props}
    />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        data-slot="menubar-shortcut"
        className={cn(
            // 自动边距
            "ml-auto",
            // 排版令牌
            "font-[var(--token-font-weight-medium)]",
            "text-[var(--token-text-xs)]",
            "uppercase",
            "leading-[var(--token-line-height-tight)]",
            "tracking-[0.05em]",
            // 颜色令牌
            "text-[var(--color-muted-foreground)]/70",
            // 渐入动画
            "fade-in",
            className,
        )}
        {...props}
    />
));
MenubarShortcut.displayName = "MenubarShortcut";

const MenubarPortal = MenubarPrimitive.Portal;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarSub = MenubarPrimitive.Sub;

export {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarPortal,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
};
