"use client";

import { ChevronRightIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
    BreadcrumbUtils,
    generateBreadcrumbDataAttributes,
    generateBreadcrumbSchema,
    getBreadcrumbConfig,
} from "@/lib/seo/breadcrumbs";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
    className?: string;
    showHome?: boolean;
    maxItems?: number;
    separator?: React.ReactNode;
    homeIcon?: React.ReactNode;
    schema?: boolean;
}

/**
 * SEO友好的面包屑导航组件
 *
 * 功能：
 * - 自动生成面包屑导航
 * - 结构化数据支持
 * - 无障碍性ARIA标签
 * - 响应式设计
 * - 可自定义样式
 *
 * 使用方法：
 * ```tsx
 * <Breadcrumb maxItems={4} showHome />
 * ```
 */
interface BreadcrumbItemShape {
    name: string;
    url: string;
}

export function Breadcrumb({
    className,
    showHome = true,
    maxItems = 5,
    separator = <ChevronRightIcon className="h-4 w-4" />,
    homeIcon = <HomeIcon className="h-4 w-4" />,
    schema = true,
}: BreadcrumbProps) {
    const pathname = usePathname();
    const t = useTranslations("Common");
    const [breadcrumbItems, setBreadcrumbItems] = useState<
        BreadcrumbItemShape[]
    >([]);

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        // 获取当前语言环境
        const currentLocale = document.documentElement.lang || "en";

        // 在实际应用中，这里应该从上下文获取locale和站点设置
        // 为了演示，我们跳过设置，交由面包屑逻辑回退到默认配置
        const siteSettings = null;

        try {
            const config = getBreadcrumbConfig(
                pathname,
                currentLocale,
                t,
                siteSettings,
            );
            const items =
                config.showHome && showHome
                    ? [
                          { name: config.homeName || "首页", url: "/" },
                          ...config.items,
                      ]
                    : config.items;

            setBreadcrumbItems(items);

            // 生成结构化数据
            if (schema && BreadcrumbUtils.shouldShowBreadcrumbs(pathname)) {
                const breadcrumbSchema = generateBreadcrumbSchema(
                    config,
                    currentLocale,
                    siteSettings,
                );

                // 创建或更新结构化数据script标签
                let scriptTag = document.getElementById(
                    "breadcrumb-schema",
                ) as HTMLScriptElement;
                if (!scriptTag) {
                    scriptTag = document.createElement("script");
                    scriptTag.id = "breadcrumb-schema";
                    scriptTag.type = "application/ld+json";
                    document.head.appendChild(scriptTag);
                }
                scriptTag.textContent = JSON.stringify(breadcrumbSchema);
            }
        } catch (error) {
            console.warn("面包屑生成失败:", error);
            setBreadcrumbItems([]);
        }
    }, [pathname, t, showHome, schema]);

    // 如果没有面包屑项，不显示组件
    if (breadcrumbItems.length === 0) {
        return null;
    }

    // 限制显示的项目数量
    const displayItems =
        breadcrumbItems.length > maxItems
            ? [
                  breadcrumbItems[0], // 首页
                  { name: "...", url: "#" }, // 省略符
                  ...breadcrumbItems.slice(-2), // 最后两项
              ]
            : breadcrumbItems;

    return (
        <nav
            className={cn(
                "flex items-center space-x-1 text-muted-foreground text-sm",
                className,
            )}
            aria-label="面包屑导航"
            {...generateBreadcrumbDataAttributes({
                items: breadcrumbItems,
                showHome,
            })}
        >
            <ol className="flex items-center space-x-1">
                {displayItems.map((item, index) => (
                    <li key={item.url} className="flex items-center space-x-1">
                        {index > 0 && (
                            <span
                                className="text-muted-foreground/50"
                                aria-hidden="true"
                            >
                                {separator}
                            </span>
                        )}

                        {item.name === "..." ? (
                            <span
                                className="text-muted-foreground/50"
                                aria-hidden="true"
                            >
                                {item.name}
                            </span>
                        ) : (
                            <Link
                                href={item.url}
                                className={cn(
                                    "transition-colors hover:text-foreground",
                                    index === displayItems.length - 1 &&
                                        "font-medium text-foreground",
                                )}
                                aria-current={
                                    index === displayItems.length - 1
                                        ? "page"
                                        : undefined
                                }
                            >
                                {index === 0 && homeIcon && (
                                    <span className="mr-1" aria-hidden="true">
                                        {homeIcon}
                                    </span>
                                )}
                                <span>{item.name}</span>
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

// 面包屑项组件（用于自定义样式）
interface BreadcrumbItemProps {
    href: string;
    children: React.ReactNode;
    isLast?: boolean;
    isFirst?: boolean;
    className?: string;
}

export function BreadcrumbItem({
    href,
    children,
    isLast = false,
    isFirst = false,
    className,
}: BreadcrumbItemProps) {
    return (
        <li className="flex items-center">
            {!isFirst && (
                <ChevronRightIcon
                    className="mx-1 h-4 w-4 text-muted-foreground/50"
                    aria-hidden="true"
                />
            )}
            <Link
                href={href}
                className={cn(
                    "transition-colors hover:text-foreground",
                    isLast && "font-medium text-foreground",
                    className,
                )}
                aria-current={isLast ? "page" : undefined}
            >
                {children}
            </Link>
        </li>
    );
}

// 面包屑容器组件
interface BreadcrumbContainerProps {
    children: React.ReactNode;
    className?: string;
    label?: string;
}

export function BreadcrumbContainer({
    children,
    className,
    label = "面包屑导航",
}: BreadcrumbContainerProps) {
    return (
        <nav
            className={cn(
                "flex items-center space-x-1 text-muted-foreground text-sm",
                className,
            )}
            aria-label={label}
        >
            <ol className="flex items-center space-x-1">{children}</ol>
        </nav>
    );
}

// 简化版面包屑组件
interface SimpleBreadcrumbProps {
    items: Array<{ name: string; href: string }>;
    className?: string;
    homeIcon?: React.ReactNode;
}

export function SimpleBreadcrumb({
    items,
    className,
    homeIcon = <HomeIcon className="h-4 w-4" />,
}: SimpleBreadcrumbProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <BreadcrumbContainer className={className}>
            {items.map((item, index) => (
                <BreadcrumbItem
                    key={item.href}
                    href={item.href}
                    isLast={index === items.length - 1}
                    isFirst={index === 0}
                >
                    {index === 0 && homeIcon}
                    {item.name}
                </BreadcrumbItem>
            ))}
        </BreadcrumbContainer>
    );
}

// 面包屑预设配置
export const BreadcrumbPresets = {
    // 营销页面
    marketing: {
        about: [
            { name: "首页", href: "/" },
            { name: "关于我们", href: "/about" },
        ],
        contact: [
            { name: "首页", href: "/" },
            { name: "联系我们", href: "/contact" },
        ],
        pricing: [
            { name: "首页", href: "/" },
            { name: "价格方案", href: "/pricing" },
        ],
    },

    // 用户仪表板
    dashboard: {
        todos: [
            { name: "仪表板", href: "/dashboard" },
            { name: "任务管理", href: "/dashboard/todos" },
        ],
        billing: [
            { name: "仪表板", href: "/dashboard" },
            { name: "计费管理", href: "/billing" },
        ],
    },

    // 管理员后台
    admin: {
        users: [
            { name: "管理后台", href: "/admin" },
            { name: "用户管理", href: "/admin/users" },
        ],
        settings: [
            { name: "管理后台", href: "/admin" },
            { name: "系统设置", href: "/admin/settings" },
        ],
    },
} as const;

// 面包屑样式预设
export const BreadcrumbStyles = {
    // 默认样式
    default: "flex items-center space-x-1 text-sm text-muted-foreground",

    // 紧凑样式
    compact: "flex items-center space-x-0.5 text-xs text-muted-foreground",

    // 大号样式
    large: "flex items-center space-x-2 text-base text-muted-foreground",

    // 卡片样式
    card: "flex items-center space-x-1 rounded-md border bg-muted/30 px-3 py-2 text-sm",

    // 导航栏样式
    navbar: "flex items-center space-x-1 text-sm text-muted-foreground/80",
} as const;

// 自定义hook：面包屑相关操作
export function useBreadcrumb() {
    const pathname = usePathname();

    const shouldShow = BreadcrumbUtils.shouldShowBreadcrumbs(pathname);
    const getCurrentPage = (items: Array<{ name: string; url: string }>) =>
        BreadcrumbUtils.getCurrentPage({ items, showHome: true });
    const getParentPage = (items: Array<{ name: string; url: string }>) =>
        BreadcrumbUtils.getParentPage({ items, showHome: true });

    return {
        shouldShow,
        pathname,
        getCurrentPage,
        getParentPage,
    };
}
