"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SkipLinkProps {
    className?: string;
    customLinks?: Array<{
        href: string;
        label: string;
    }>;
}

/**
 * 跳转到主要内容的可访问性链接
 *
 * 功能：
 * - 为键盘用户提供快速跳转到主要内容的导航
 * - 支持自定义跳转链接
 * - 符合WCAG 2.1 AA级别标准
 * - 仅在获得焦点时显示
 *
 * 使用方法：
 * ```tsx
 * <SkipLink />
 * ```
 */
export function SkipLink({ className, customLinks = [] }: SkipLinkProps) {
    const t = useTranslations("Accessibility");

    // 默认跳转链接
    const defaultLinks = [
        { href: "#main-content", label: t("skipToMain") },
        { href: "#navigation", label: t("skipToNavigation") },
    ];

    // 合并默认和自定义链接
    const allLinks = [...defaultLinks, ...customLinks].filter((link) => {
        // 检查目标元素是否存在于当前页面
        if (typeof document !== "undefined") {
            const target = document.querySelector(link.href);
            return target !== null;
        }
        return true; // 在SSR阶段假设存在
    });

    // 如果没有有效链接，不显示组件
    if (allLinks.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed top-0 left-0 z-[9999] flex flex-col gap-1",
                className,
            )}
        >
            {allLinks.map((link, index) => (
                <a
                    key={`${link.href}-${index}`}
                    href={link.href}
                    className="skip-link rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={(event) => {
                        event.preventDefault();
                        const target = document.querySelector(link.href) as HTMLElement;
                        if (target) {
                            target.focus();
                            target.scrollIntoView({ behavior: "smooth" });
                        }
                    }}
                >
                    {link.label}
                </a>
            ))}
        </div>
    );
}
