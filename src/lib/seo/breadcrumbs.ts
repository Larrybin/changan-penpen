import type { AppLocale } from "@/i18n/config";
import { getSupportedAppLocales } from "@/i18n/config";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import { buildLocalizedPath } from "../seo";

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
type Translator = (key: string) => string;

interface RouteDescriptor {
    key: string;
    fallback: string;
    path: string;
    showHome?: boolean;
}

interface BreadcrumbMatch {
    items: BreadcrumbItem[];
    showHome?: boolean;
}

const HOME_TRANSLATION_KEY = "Breadcrumbs.home";
const HOME_FALLBACK_NAME = "首页";
const AUTHENTICATION_PATHS = new Set(["login", "signup"]);
const HIDDEN_PATHS = new Set(["/", "", "login", "signup", "404", "500"]);

const STATIC_ROUTES: Record<string, RouteDescriptor> = {
    about: {
        key: "Pages.about.title",
        fallback: "关于我们",
        path: "/about",
    },
    contact: {
        key: "Pages.contact.title",
        fallback: "联系我们",
        path: "/contact",
    },
    privacy: {
        key: "Pages.privacy.title",
        fallback: "隐私政策",
        path: "/privacy",
    },
    terms: {
        key: "Pages.terms.title",
        fallback: "服务条款",
        path: "/terms",
    },
    dashboard: {
        key: "Dashboard.title",
        fallback: "仪表板",
        path: "/dashboard",
    },
    billing: {
        key: "Billing.title",
        fallback: "计费",
        path: "/billing",
    },
};

const ADMIN_SUB_ROUTES: Record<string, RouteDescriptor> = {
    users: {
        key: "Admin.users",
        fallback: "用户管理",
        path: "/admin/users",
    },
    todos: {
        key: "Admin.todos",
        fallback: "任务管理",
        path: "/admin/todos",
    },
    reports: {
        key: "Admin.reports",
        fallback: "报表分析",
        path: "/admin/reports",
    },
    settings: {
        key: "Admin.settings",
        fallback: "系统设置",
        path: "/admin/settings",
    },
};

function translate(t: Translator, key: string, fallback: string) {
    const value = t(key);
    return value && value.trim().length > 0 ? value : fallback;
}

function normalizePath(pathname: string) {
    const trimmed = pathname.trim();
    const withoutLeading = trimmed.replace(/^\/+/, "");
    const normalized = withoutLeading || "/";
    const segments =
        normalized === "/" ? [] : normalized.split("/").filter(Boolean);
    return { normalized, segments };
}

function createTranslatedItem(
    locale: AppLocale,
    descriptor: RouteDescriptor,
    t: Translator,
): BreadcrumbItem {
    return {
        name: translate(t, descriptor.key, descriptor.fallback),
        url: buildLocalizedPath(locale, descriptor.path),
    };
}

function resolveStaticBreadcrumb(
    normalizedPath: string,
    locale: AppLocale,
    t: Translator,
): BreadcrumbMatch | null {
    const descriptor = STATIC_ROUTES[normalizedPath];
    if (!descriptor) {
        return null;
    }
    return {
        items: [createTranslatedItem(locale, descriptor, t)],
        showHome: descriptor.showHome,
    };
}

function resolveDashboardTodosBreadcrumb(
    segments: string[],
    locale: AppLocale,
    t: Translator,
): BreadcrumbMatch | null {
    if (segments[0] !== "dashboard" || segments[1] !== "todos") {
        return null;
    }

    const items: BreadcrumbItem[] = [
        createTranslatedItem(locale, STATIC_ROUTES.dashboard, t),
        {
            name: translate(t, "Todos.title", "任务管理"),
            url: buildLocalizedPath(locale, "/dashboard/todos"),
        },
    ];

    const action = segments[2];
    if (action === "edit" && segments[3]) {
        items.push({
            name: translate(t, "Todos.edit", "编辑任务"),
            url: buildLocalizedPath(
                locale,
                `/dashboard/todos/${segments[3]}/edit`,
            ),
        });
    } else if (action === "new") {
        items.push({
            name: translate(t, "Todos.new", "新建任务"),
            url: buildLocalizedPath(locale, "/dashboard/todos/new"),
        });
    }

    return { items };
}

function resolveAdminBreadcrumb(
    segments: string[],
    locale: AppLocale,
    t: Translator,
): BreadcrumbMatch | null {
    if (segments[0] !== "admin") {
        return null;
    }

    const items: BreadcrumbItem[] = [
        {
            name: translate(t, "Admin.title", "管理后台"),
            url: buildLocalizedPath(locale, "/admin"),
        },
    ];

    const subRoute = segments[1];
    const descriptor = subRoute ? ADMIN_SUB_ROUTES[subRoute] : undefined;
    if (descriptor) {
        items.push(createTranslatedItem(locale, descriptor, t));
    }

    return { items };
}

export function getBreadcrumbConfig(
    pathname: string,
    locale: string,
    t: Translator,
    siteSettings?: SiteSettingsPayload | null,
): BreadcrumbConfig {
    const { normalized, segments } = normalizePath(pathname);
    const fallbackLocale: AppLocale = siteSettings?.defaultLanguage || "en";
    const activeLocale = normalizeLocale(locale, fallbackLocale);
    const homeName = translate(t, HOME_TRANSLATION_KEY, HOME_FALLBACK_NAME);

    if (normalized === "/" || normalized === "") {
        return {
            items: [],
            showHome: false,
            homeName,
        };
    }

    const defaultShowHome = !AUTHENTICATION_PATHS.has(normalized);

    const staticMatch = resolveStaticBreadcrumb(normalized, activeLocale, t);
    if (staticMatch) {
        return {
            items: staticMatch.items,
            homeName,
            showHome: staticMatch.showHome ?? defaultShowHome,
        };
    }

    const dashboardMatch = resolveDashboardTodosBreadcrumb(
        segments,
        activeLocale,
        t,
    );
    if (dashboardMatch) {
        return {
            items: dashboardMatch.items,
            homeName,
            showHome: dashboardMatch.showHome ?? defaultShowHome,
        };
    }

    const adminMatch = resolveAdminBreadcrumb(segments, activeLocale, t);
    if (adminMatch) {
        return {
            items: adminMatch.items,
            homeName,
            showHome: adminMatch.showHome ?? defaultShowHome,
        };
    }

    return {
        items: [],
        homeName,
        showHome: !HIDDEN_PATHS.has(normalized) && defaultShowHome,
    };
}

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbSchema(
    config: BreadcrumbConfig,
    locale: string,
    siteSettings?: SiteSettingsPayload | null,
): BreadcrumbSchema {
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
    config.items.forEach((item, _index) => {
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
function shouldShowBreadcrumbs(pathname: string) {
    const { normalized } = normalizePath(pathname);
    return !HIDDEN_PATHS.has(normalized);
}

function getCurrentPage(config: BreadcrumbConfig): BreadcrumbItem | null {
    if (config.items.length === 0) {
        const showHome = config.showHome ?? true;
        return showHome
            ? { name: config.homeName || HOME_FALLBACK_NAME, url: "/" }
            : null;
    }
    return config.items[config.items.length - 1];
}

function getParentPage(config: BreadcrumbConfig): BreadcrumbItem | null {
    if (config.items.length <= 1) {
        return config.showHome
            ? { name: config.homeName || HOME_FALLBACK_NAME, url: "/" }
            : null;
    }
    return config.items[config.items.length - 2];
}

function toJSONLD(
    config: BreadcrumbConfig,
    locale: string,
    siteSettings?: SiteSettingsPayload | null,
): string {
    const schema = generateBreadcrumbSchema(config, locale, siteSettings);
    return JSON.stringify(schema);
}

export const BreadcrumbUtils = {
    shouldShowBreadcrumbs,
    getCurrentPage,
    getParentPage,
    toJSONLD,
} as const;

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
