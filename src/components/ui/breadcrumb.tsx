import { Slot } from "@radix-ui/react-slot";
import { ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type BreadcrumbProps = React.HTMLAttributes<HTMLElement>;

export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
    return (
        <nav
            aria-label="breadcrumb"
            className={cn(
                // 基础样式
                "w-full",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    );
}

export const BreadcrumbList = React.forwardRef<
    HTMLOListElement,
    React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={cn(
            // 基础布局
            "inline-flex items-center flex-wrap",
            // 间距令牌
            "gap-[var(--token-spacing-1)]",
            // 排版令牌
            "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
            // 颜色令牌
            "text-[var(--color-muted-foreground)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = React.forwardRef<
    HTMLLIElement,
    React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
    <li
        ref={ref}
        className={cn(
            // 基础布局
            "inline-flex items-center",
            // 间距令牌
            "gap-[var(--token-spacing-1)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export interface BreadcrumbLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    asChild?: boolean;
}

export const BreadcrumbLink = React.forwardRef<
    HTMLAnchorElement,
    BreadcrumbLinkProps
>(({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return (
        <Comp
            ref={ref}
            className={cn(
                // 基础布局
                "inline-flex items-center",
                // 间距令牌
                "gap-[var(--token-spacing-1)]",
                // 排版令牌
                "text-[var(--token-text-sm)] leading-[var(--token-line-height-normal)]",
                // 颜色令牌
                "text-[var(--color-muted-foreground)]",
                // 微交互
                "transition-[color,transform] duration-[var(--token-motion-duration-fast)] ease-[var(--token-motion-ease-standard)]",
                "hover:text-[var(--color-foreground)] hover:scale-[1.02]",
                // 焦点状态
                "focus-visible:ring-[var(--token-focus-ring-width,2px)] focus-visible:ring-[var(--token-focus-ring-color,var(--color-primary))] focus-visible:ring-offset-[var(--token-focus-ring-offset,2px)] focus-visible:ring-offset-[var(--color-background)] rounded-[var(--token-radius-sm)]",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        />
    );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        aria-current="page"
        className={cn(
            // 基础布局
            "inline-flex items-center",
            // 排版令牌
            "text-[var(--token-text-sm)] font-[var(--token-font-weight-semibold)] leading-[var(--token-line-height-tight)]",
            // 颜色令牌
            "text-[var(--color-foreground)]",
            // 渐入动画
            "fade-in",
            className
        )}
        {...props}
    />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

export function BreadcrumbSeparator({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            role="presentation"
            className={cn(
                // 基础布局
                "inline-flex items-center justify-center",
                // 尺寸令牌
                "size-[var(--token-spacing-4)]",
                // 颜色令牌
                "text-[var(--color-muted-foreground)]/60",
                // 渐入动画
                "fade-in",
                className
            )}
            {...props}
        >
            <ChevronRightIcon className="size-3" />
        </span>
    );
}