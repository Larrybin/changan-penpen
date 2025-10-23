"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const MOBILE_MEDIA_QUERY = "(max-width: 640px)";

function useMediaQuery(query: string) {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQueryList = window.matchMedia(query);

        const updateMatch = () => {
            setMatches(mediaQueryList.matches);
        };

        updateMatch();

        if (typeof mediaQueryList.addEventListener === "function") {
            mediaQueryList.addEventListener("change", updateMatch);
            return () =>
                mediaQueryList.removeEventListener("change", updateMatch);
        }

        mediaQueryList.addListener(updateMatch);

        return () => mediaQueryList.removeListener(updateMatch);
    }, [query]);

    return matches;
}

function Select({
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
    return (
        <SelectPrimitive.Root
            data-slot="select"
            className={cn(
                // 基础动画类
                "fade-in",
                props.className
            )}
            {...props}
        />
    );
}

function SelectGroup({
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn(
                // 基础布局
                "grid gap-[var(--token-spacing-1)]",
                props.className
            )}
            {...props}
        />
    );
}

function SelectValue({
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
    return (
        <SelectPrimitive.Value
            data-slot="select-value"
            className={cn(
                // 基础样式
                "line-clamp-1 flex items-center gap-[var(--token-spacing-2)]",
                props.className
            )}
            {...props}
        />
    );
}

function SelectTrigger({
    className,
    size = "default",
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "default";
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                // 统一表单基础类
                "form-control-base",
                // Select特定样式
                "w-fit text-sm whitespace-nowrap",
                // 尺寸变体
                "data-[size=sm]:h-[calc(var(--token-height-control-sm))]",
                // 占位符样式
                "data-[placeholder]:text-[var(--color-muted-foreground)]",
                // 图标颜色
                "[&_svg:not([class*='text-'])]:text-[var(--color-muted-foreground)]",
                // 微交互
                "hover:border-[var(--color-accent)]",
                // 焦点增强
                "focus-visible-enhanced",
                // 颜色过渡
                "color-transition",
                // 渐入动画
                "fade-in",
                // 图标样式
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDownIcon
                    className={cn(
                        // 图标基础样式
                        "size-4 shrink-0 transition-transform duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                        // 颜色样式
                        "text-[var(--color-muted-foreground)]/60",
                        // 动画状态
                        "data-[state=open]:rotate-180 data-[state=closed]:rotate-0"
                    )}
                />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

type SelectContentProps = React.ComponentProps<
    typeof SelectPrimitive.Content
> & {
    /**
     * Automatically switches to a bottom-sheet style layout when the viewport
     * is narrow. Set to "popover" to always use the floating popper layout or
     * "sheet" to always force the mobile-friendly variant.
     */
    mobileLayout?: "auto" | "popover" | "sheet";
    /**
     * Override the maximum height applied to the dropdown viewport. Accepts a
     * CSS length value or number (treated as pixels).
     */
    mobileMaxHeight?: string | number;
};

function SelectContent({
    className,
    children,
    position = "popper",
    mobileLayout = "auto",
    mobileMaxHeight = "min(calc(100vh - 4rem), var(--radix-select-content-available-height))",
    style,
    ...props
}: SelectContentProps) {
    const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
    const resolvedLayout =
        mobileLayout === "auto"
            ? isMobile
                ? "sheet"
                : "popover"
            : mobileLayout;
    const resolvedMaxHeight =
        typeof mobileMaxHeight === "number"
            ? `${mobileMaxHeight}px`
            : mobileMaxHeight;

    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                data-slot="select-content"
                data-layout={resolvedLayout}
                className={cn(
                    // 基础样式
                    "overflow-x-hidden overflow-y-auto",
                    // 背景色和圆角令牌
                    "bg-[var(--color-popover,var(--color-background))] text-[var(--color-popover-foreground,var(--color-foreground))]",
                    "rounded-[var(--token-radius-card,var(--token-radius-md))]",
                    // 边框和阴影令牌
                    "border border-[var(--color-border,var(--color-muted-foreground)/10)] shadow-[var(--shadow-lg)]",
                    // 进场和出场动画
                    "data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    // 过渡动画
                    "transition-[all,transform] duration-[var(--token-motion-duration-normal)] ease-[var(--token-motion-ease-standard)]",
                    // 渐入动画
                    "fade-in",
                    // Popover布局样式
                    resolvedLayout === "popover" && [
                        "relative z-[var(--z-dropdown,40)] min-w-[8rem]",
                        "origin-[var(--radix-select-content-transform-origin)]",
                        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    ],
                    resolvedLayout === "popover" && position === "popper" && [
                        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1",
                        "data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
                    ],
                    // Sheet布局样式
                    resolvedLayout === "sheet" && [
                        "fixed inset-x-3 bottom-4 left-1/2 top-auto z-[var(--z-modal,50)]",
                        "w-[calc(100%-1.5rem)] translate-x-[-50%] translate-y-0 origin-bottom",
                        "bg-[var(--color-background)] shadow-[var(--shadow-xl)]",
                        "data-[state=closed]:slide-out-to-bottom-2 data-[state=open]:slide-in-from-bottom-2"
                    ],
                    className
                )}
                position={position}
                style={{
                    maxHeight: resolvedMaxHeight,
                    ...(style ?? {}),
                }}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    data-layout={resolvedLayout}
                    className={cn(
                        // 基础内边距
                        "p-[var(--token-spacing-1)]",
                        // Popover特定样式
                        position === "popper" && resolvedLayout === "popover" && [
                            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
                            "scroll-my-1"
                        ],
                        // Sheet特定样式
                        resolvedLayout === "sheet" && "w-full"
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return (
        <SelectPrimitive.Label
            data-slot="select-label"
            className={cn(
                // 排版令牌
                "text-[var(--token-text-xs)] font-[var(--token-font-weight-medium)] leading-[var(--token-line-height-tight)]",
                // 颜色令牌
                "text-[var(--color-muted-foreground)]",
                // 内边距令牌
                "px-[var(--token-spacing-2)] py-[var(--token-spacing-1.5)]",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                // 基础样式
                "relative flex w-full cursor-default items-center gap-[var(--token-spacing-2)]",
                // 内边距和圆角
                "rounded-[var(--token-radius-button,var(--token-radius-sm))]",
                "py-[var(--token-spacing-1.5)] pr-[var(--token-spacing-8)] pl-[var(--token-spacing-2)]",
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                // 焦点和选中状态
                "focus:bg-[var(--color-accent)] focus:text-[var(--color-accent-foreground)]",
                "data-[highlighted]:bg-[var(--color-accent)] data-[highlighted]:text-[var(--color-accent-foreground)]",
                "data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:text-[var(--color-accent-foreground)]",
                // 禁用状态
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                // 过渡动画
                "color-transition transition-[background-color,color] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                // 图标样式
                "[&_svg:not([class*='text-'])]:text-[var(--color-muted-foreground)]",
                "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                // 特殊布局处理
                "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-[var(--token-spacing-2)]",
                className
            )}
            {...props}
        >
            <span className={cn(
                // 选中指示器位置
                "absolute right-[var(--token-spacing-2)] flex size-3.5 items-center justify-center",
                // 渐入动画
                "fade-in"
            )}>
                <SelectPrimitive.ItemIndicator>
                    <CheckIcon
                        className={cn(
                            // 图标样式
                            "size-4 text-[var(--color-primary)]",
                            // 动画
                            "scale-active transition-transform duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]"
                        )}
                    />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText className={cn(
                // 文本样式
                "truncate",
                // 渐入动画
                "fade-in"
            )}>
                {children}
            </SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn(
                // 分隔线样式
                "bg-[var(--color-border,var(--color-muted-foreground)/10)] pointer-events-none",
                // 位置和尺寸
                "-mx-[var(--token-spacing-1)] my-[var(--token-spacing-1)] h-px",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton
            data-slot="select-scroll-up-button"
            className={cn(
                // 基础样式
                "flex cursor-default items-center justify-center",
                // 内边距
                "py-[var(--token-spacing-1)]",
                // 颜色和过渡
                "text-[var(--color-muted-foreground)]/60 hover:text-[var(--color-foreground)]",
                "color-transition transition-colors duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        >
            <ChevronUpIcon className="size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton
            data-slot="select-scroll-down-button"
            className={cn(
                // 基础样式
                "flex cursor-default items-center justify-center",
                // 内边距
                "py-[var(--token-spacing-1)]",
                // 颜色和过渡
                "text-[var(--color-muted-foreground)]/60 hover:text-[var(--color-foreground)]",
                "color-transition transition-colors duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        >
            <ChevronDownIcon className="size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};