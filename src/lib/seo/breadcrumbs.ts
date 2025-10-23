import type { AppLocale } from "@/i18n/config";
import { getSupportedAppLocales } from "@/i18n/config";
import { buildLocalizedPath, resolveAppUrl } from "../seo";

const SUPPORTED_LOCALES = new Set<AppLocale>(getSupportedAppLocales());

function normalizeLocale(locale: string, fallback: AppLocale): AppLocale {
    const trimmed = locale.trim().toLowerCase();
    if (SUPPORTED_LOCALES.has(trimmed as AppLocale)) {
        return trimmed as AppLocale;
    }
    return fallback;
}

interface BreadcrumbItem {
    name: string;
    url: string;
}

interface BreadcrumbSchema {
    "@context": "https://schema.org";
    "@type": "BreadcrumbList";
    itemListElement: Array<{
        "@type": "ListItem";
        position: number;
        name: string;
        item: string;
    }>;
}

/**
 * 面包屑配置类型
 */
export interface BreadcrumbConfig {
    /** 面包屑项目 */
    items: BreadcrumbItem[];
    /** 是否显示首页 */
    showHome?: boolean;
    /** 首页自定义名称 */
    homeName?: string;
}

/**
 * 获取面包屑配置
 * 根据当前路径生成对应的面包屑配置
 */
export function getBreadcrumbConfig(
    pathname: string,
    locale: string,
    t: (key: string) => string,
    siteSettings?: any,
): BreadcrumbConfig {
    // 规范化路径
    const normalizedPath = pathname.replace(/^\/+/, "") || "/";
    const pathSegments = normalizedPath.split("/").filter(Boolean);

    const baseUrl = resolveAppUrl(siteSettings, {});
    const fallbackLocale: AppLocale = siteSettings?.defaultLanguage || "en";
    const activeLocale = normalizeLocale(locale, fallbackLocale);

    // 默认配置
    const config: BreadcrumbConfig = {
        showHome: true,
        homeName: t("Breadcrumbs.home") || "首页",
        items: [],
    };

    // 根据路径生成面包屑
    switch (normalizedPath) {
        case "/":
        case "":
            // 首页不显示面包屑
            config.showHome = false;
            break;

        case "about":
            config.items = [
                {
                    name: t("Pages.about.title") || "关于我们",
                    url: buildLocalizedPath(activeLocale, "/about"),
                },
            ];
            break;

        case "contact":
            config.items = [
                {
                    name: t("Pages.contact.title") || "联系我们",
                    url: buildLocalizedPath(activeLocale, "/contact"),
                },
            ];
            break;

        case "privacy":
            config.items = [
                {
                    name: t("Pages.privacy.title") || "隐私政策",
                    url: buildLocalizedPath(activeLocale, "/privacy"),
                },
            ];
            break;

        case "terms":
            config.items = [
                {
                    name: t("Pages.terms.title") || "服务条款",
                    url: buildLocalizedPath(activeLocale, "/terms"),
                },
            ];
            break;

        case "dashboard":
            config.items = [
                {
                    name: t("Dashboard.title") || "仪表板",
                    url: buildLocalizedPath(activeLocale, "/dashboard"),
                },
            ];
            break;

        case "billing":
            config.items = [
                {
                    name: t("Billing.title") || "计费",
                    url: buildLocalizedPath(activeLocale, "/billing"),
                },
            ];
            break;

        case "login":
        case "signup":
            // 认证页面通常不显示面包屑
            config.showHome = false;
            break;

        default:
            // 动态路由处理
            if (
                pathSegments[0] === "dashboard" &&
                pathSegments[1] === "todos"
            ) {
                config.items = [
                    {
                        name: t("Dashboard.title") || "仪表板",
                        url: buildLocalizedPath(activeLocale, "/dashboard"),
                    },
                    {
                        name: t("Todos.title") || "任务管理",
                        url: buildLocalizedPath(
                            activeLocale,
                            "/dashboard/todos",
                        ),
                    },
                ];

                // 编辑任务页面
                if (pathSegments[2] === "edit") {
                    config.items.push({
                        name: t("Todos.edit") || "编辑任务",
                        url: buildLocalizedPath(
                            activeLocale,
                            `/dashboard/todos/${pathSegments[3]}/edit`,
                        ),
                    });
                } else if (pathSegments[2] === "new") {
                    config.items.push({
                        name: t("Todos.new") || "新建任务",
                        url: buildLocalizedPath(
                            activeLocale,
                            "/dashboard/todos/new",
                        ),
                    });
                }
            } else if (pathSegments[0] === "admin") {
                config.items = [
                    {
                        name: t("Admin.title") || "管理后台",
                        url: buildLocalizedPath(activeLocale, "/admin"),
                    },
                ];

                // 管理员子页面
                if (pathSegments[1]) {
                    const adminPageMap: Record<string, string> = {
                        users: t("Admin.users") || "用户管理",
                        todos: t("Admin.todos") || "任务管理",
                        reports: t("Admin.reports") || "报表分析",
                        settings: t("Admin.settings") || "系统设置",
                    };

                    if (adminPageMap[pathSegments[1]]) {
                        config.items.push({
                            name: adminPageMap[pathSegments[1]],
                            url: buildLocalizedPath(
                                activeLocale,
                                `/admin/${pathSegments[1]}`,
                            ),
                        });
                    }
                }
            }
            break;
    }

    return config;
}

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbSchema(
    config: BreadcrumbConfig,
    locale: string,
    siteSettings?: any,
): BreadcrumbSchema {
    const baseUrl = resolveAppUrl(siteSettings, {});
    const items = [];
    const fallbackLocale: AppLocale = siteSettings?.defaultLanguage || "en";
    const activeLocale = normalizeLocale(locale, fallbackLocale);

    // 添加首页（如果显示）
    if (config.showHome) {
        items.push({
            "@type": "ListItem" as const,
            position: 1,
            name: config.homeName || "首页",
            item: buildLocalizedPath(activeLocale, "/"),
        });
    }

    // 添加其他面包屑项
    config.items.forEach((item, index) => {
        items.push({
            "@type": "ListItem" as const,
            position: items.length + 1,
            name: item.name,
            item: item.url,
        });
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
    };
}

/**
 * 生成面包屑导航的HTML数据属性
 * 用于SEO和无障碍性
 */
export function generateBreadcrumbDataAttributes(config: BreadcrumbConfig) {
    const showHome = config.showHome ?? true;
    return {
        "data-breadcrumb": "true",
        "data-items": config.items.length.toString(),
        "data-show-home": showHome.toString(),
    };
}

/**
 * 面包屑工具类
 * 提供常用的面包屑操作方法
 */
export class BreadcrumbUtils {
    /**
     * 检查路径是否需要面包屑
     */
    static shouldShowBreadcrumbs(pathname: string): boolean {
        const noBreadcrumbPaths = ["/", "/login", "/signup", "/404", "/500"];

        const normalizedPath = pathname.replace(/^\/+/, "") || "/";
        return !noBreadcrumbPaths.includes(normalizedPath);
    }

    /**
     * 获取面包屑的最后一项（当前页面）
     */
    static getCurrentPage(config: BreadcrumbConfig): BreadcrumbItem | null {
        if (config.items.length === 0) {
            const showHome = config.showHome ?? true;
            return showHome
                ? { name: config.homeName || "首页", url: "/" }
                : null;
        }
        return config.items[config.items.length - 1];
    }

    /**
     * 获取面包屑的父级页面
     */
    static getParentPage(config: BreadcrumbConfig): BreadcrumbItem | null {
        if (config.items.length <= 1) {
            return config.showHome
                ? { name: config.homeName || "首页", url: "/" }
                : null;
        }
        return config.items[config.items.length - 2];
    }

    /**
     * 格式化面包屑为JSON-LD字符串
     */
    static toJSONLD(
        config: BreadcrumbConfig,
        locale: string,
        siteSettings?: any,
    ): string {
        const schema = generateBreadcrumbSchema(config, locale, siteSettings);
        return JSON.stringify(schema);
    }
}

/**
 * 预定义的面包屑配置
 */
export const BreadcrumbPresets = {
    // 营销页面
    marketing: {
        about: {
            items: [{ name: "关于我们", url: "/about" }],
            showHome: true,
        },
        contact: {
            items: [{ name: "联系我们", url: "/contact" }],
            showHome: true,
        },
        pricing: {
            items: [{ name: "价格方案", url: "/pricing" }],
            showHome: true,
        },
    },

    // 用户仪表板
    dashboard: {
        todos: {
            items: [
                { name: "仪表板", url: "/dashboard" },
                { name: "任务管理", url: "/dashboard/todos" },
            ],
            showHome: false,
        },
        billing: {
            items: [{ name: "计费管理", url: "/billing" }],
            showHome: false,
        },
    },

    // 管理员后台
    admin: {
        users: {
            items: [
                { name: "管理后台", url: "/admin" },
                { name: "用户管理", url: "/admin/users" },
            ],
            showHome: false,
        },
        settings: {
            items: [
                { name: "管理后台", url: "/admin" },
                { name: "系统设置", url: "/admin/settings" },
            ],
            showHome: false,
        },
    },
} as const;
