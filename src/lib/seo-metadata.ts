import type { Metadata } from "next";

import type { AppLocale } from "@/i18n/config";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

import {
    buildLocalizedPath,
    ensureAbsoluteUrl,
    getActiveAppLocales,
    resolveAppUrl,
} from "./seo";

const openGraphLocales: Record<AppLocale, string> = {
    en: "en_US",
    de: "de_DE",
    fr: "fr_FR",
    pt: "pt_BR",
};

type MetadataBundle = {
    Metadata: MetadataMessages;
};

export type MetadataMessages = {
    title: string;
    description: string;
    keywords: string[];
    openGraph: {
        title: string;
        description: string;
        siteName: string;
        imageAlt: string;
    };
    twitter: {
        title: string;
        description: string;
        imageAlt: string;
    };
    login: {
        title: string;
        description: string;
    };
    signup: {
        title: string;
        description: string;
    };
    dashboard: {
        title: string;
        description: string;
    };
    dashboardTodos: {
        title: string;
        description: string;
    };
    billing: {
        title: string;
        description: string;
    };
    billingUsage: {
        title: string;
        description: string;
    };
    billingSuccess: {
        title: string;
        description: string;
    };
    billingCancel: {
        title: string;
        description: string;
    };
    about: {
        title: string;
        description: string;
    };
    contact: {
        title: string;
        description: string;
    };
    privacy: {
        title: string;
        description: string;
    };
    terms: {
        title: string;
        description: string;
    };
};

export type MetadataContext = {
    locale: AppLocale;
    messages: MetadataMessages;
    settings: Awaited<ReturnType<typeof getSiteSettingsPayload>>;
    appUrl: string;
    metadataBase?: URL;
    shareImage: string;
    activeLocales: AppLocale[];
};

function ensureLeadingSlash(path: string): string {
    if (!path) {
        return "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
}

function resolveLocalizedSetting(
    locale: AppLocale,
    localized: Partial<Record<AppLocale, string>>,
    fallback: string,
    defaultLocale: AppLocale,
): string {
    const preferred = localized?.[locale]?.trim();
    if (preferred) {
        return preferred;
    }
    const defaultValue = localized?.[defaultLocale]?.trim();
    if (defaultValue) {
        return defaultValue;
    }
    return fallback;
}

export async function getMetadataContext(
    locale: AppLocale,
): Promise<MetadataContext> {
    const [settings, messagesModule] = await Promise.all([
        getSiteSettingsPayload(),
        import(`@/i18n/messages/${locale}.json`) as Promise<MetadataBundle>,
    ]);

    const metadataMessages = messagesModule.Metadata;
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = resolveAppUrl(settings, { envAppUrl });

    let metadataBase: URL | undefined;
    try {
        metadataBase = new URL(appUrl);
    } catch (error) {
        console.warn("Failed to construct metadata base", { error });
        metadataBase = undefined;
    }

    const defaultLocale = settings.defaultLanguage;
    const shareImageSource = resolveLocalizedSetting(
        locale,
        settings.seoOgImageLocalized,
        settings.seoOgImage?.trim() ?? "",
        defaultLocale,
    );
    const shareImage = ensureAbsoluteUrl(
        shareImageSource?.length ? shareImageSource : "/og-image.svg",
        appUrl,
    );
    const activeLocales = getActiveAppLocales(settings);

    return {
        locale,
        messages: metadataMessages,
        settings,
        appUrl,
        metadataBase,
        shareImage,
        activeLocales,
    };
}

export type CreateMetadataOptions = {
    title?: string;
    description?: string;
    keywords?: string[];
    path?: string;
    robots?: Metadata["robots"];
    openGraph?: Metadata["openGraph"];
    twitter?: Metadata["twitter"];
    openGraphImageAlt?: string;
    twitterImageAlt?: string;
    // 新增：文章类型支持
    article?: {
        publishedTime?: string;
        modifiedTime?: string;
        authors?: string[];
        section?: string;
        tags?: string[];
    };
    // 新增：作者信息
    author?: {
        name: string;
        url?: string;
        image?: string;
    };
    // 新增：发布者信息
    publisher?: {
        name: string;
        url?: string;
        logo?: string;
    };
    // 新增：内容分类
    category?: string;
    // 新增：生成器信息
    generator?: string;
    // 新增：应用名称
    applicationName?: string;
    // 新增：引用信息
    referrer?: string;
    // 新增：创建者
    creator?: string;
    // 新增：预加载资源
    preload?: Array<{
        href: string;
        as: string;
        type?: string;
        crossOrigin?: string;
    }>;
    // 新增：结构化数据
    structuredData?: any;
};

export function createMetadata(
    context: MetadataContext,
    options: CreateMetadataOptions = {},
): Metadata {
    const canonicalPath = ensureLeadingSlash(options.path ?? "/");
    const canonical = buildLocalizedPath(context.locale, canonicalPath);
    const languages = context.activeLocales.reduce(
        (acc, locale) => {
            acc[locale] = buildLocalizedPath(locale, canonicalPath);
            return acc;
        },
        {} as Record<string, string>,
    );
    const defaultLocale = context.settings.defaultLanguage;
    const localizedTitle = resolveLocalizedSetting(
        context.locale,
        context.settings.seoTitleLocalized,
        context.settings.seoTitle ?? "",
        defaultLocale,
    );
    const fallbackTitle = localizedTitle?.trim().length
        ? localizedTitle.trim()
        : context.messages.title;
    const localizedDescription = resolveLocalizedSetting(
        context.locale,
        context.settings.seoDescriptionLocalized,
        context.settings.seoDescription ?? "",
        defaultLocale,
    );
    const fallbackDescription = localizedDescription?.trim().length
        ? localizedDescription.trim()
        : context.messages.description;
    const title = options.title?.trim().length
        ? options.title.trim()
        : fallbackTitle;
    const description = options.description?.trim().length
        ? options.description.trim()
        : fallbackDescription;
    const keywords = options.keywords ?? context.messages.keywords;
    const openGraphAlt =
        options.openGraphImageAlt ?? context.messages.openGraph.imageAlt;
    const twitterAlt =
        options.twitterImageAlt ?? context.messages.twitter.imageAlt;
    const siteName = context.settings.siteName?.trim().length
        ? context.settings.siteName.trim()
        : context.messages.openGraph.siteName;
    const absoluteCanonical =
        canonical === "/" ? context.appUrl : `${context.appUrl}${canonical}`;
    const defaultRobots: NonNullable<Metadata["robots"]> = {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    };
    // 构建基础Open Graph数据
    const baseOpenGraph: NonNullable<Metadata["openGraph"]> = {
        title,
        description,
        url: absoluteCanonical,
        siteName,
        locale: openGraphLocales[context.locale],
        type: "website",
        images: [
            {
                url: context.shareImage,
                width: 1200,
                height: 630,
                alt: openGraphAlt,
            },
        ],
    };

    // 如果有文章信息，添加article类型
    if (options.article) {
        baseOpenGraph.type = "article";
        if (options.article.publishedTime) {
            baseOpenGraph.publishedTime = options.article.publishedTime;
        }
        if (options.article.modifiedTime) {
            baseOpenGraph.modifiedTime = options.article.modifiedTime;
        }
        if (options.article.authors && options.article.authors.length > 0) {
            baseOpenGraph.authors = options.article.authors.map(author => author);
        }
        if (options.article.section) {
            baseOpenGraph.section = options.article.section;
        }
        if (options.article.tags && options.article.tags.length > 0) {
            baseOpenGraph.tags = options.article.tags;
        }
    }

    // 添加作者信息
    if (options.author) {
        baseOpenGraph.authors = [
            {
                type: "Person",
                name: options.author.name,
                url: options.author.url,
            },
            ...(baseOpenGraph.authors || []),
        ];
    }

    const openGraph = options.openGraph
        ? {
              ...baseOpenGraph,
              ...options.openGraph,
              images: options.openGraph.images ?? baseOpenGraph.images,
          }
        : baseOpenGraph;
    // 构建增强的Twitter Cards
    const baseTwitter: NonNullable<Metadata["twitter"]> = {
        card: "summary_large_image",
        title,
        description,
        site: context.settings.siteName?.trim() || context.messages.openGraph.siteName,
        creator: options.creator || context.settings.creatorTwitter,
        images: [
            {
                url: context.shareImage,
                alt: twitterAlt,
                width: 1200,
                height: 630,
            },
        ],
    };

    // 如果是文章类型，设置不同的卡片
    if (options.article) {
        baseTwitter.card = "summary_large_image";
    }

    const twitter = options.twitter
        ? {
              ...baseTwitter,
              ...options.twitter,
              images: options.twitter.images ?? baseTwitter.images,
              title: options.twitter.title ?? baseTwitter.title,
              description:
                  options.twitter.description ?? baseTwitter.description,
          }
        : baseTwitter;

    // 构建其他元数据
    const other: Record<string, string> = {};

    // 添加内容分类
    if (options.category) {
        other["category"] = options.category;
    }

    // 添加生成器信息
    if (options.generator) {
        other["generator"] = options.generator;
    } else {
        other["generator"] = "Next.js 15";
    }

    // 添加应用名称
    if (options.applicationName) {
        other["application-name"] = options.applicationName;
    } else if (context.settings.siteName) {
        other["application-name"] = context.settings.siteName;
    }

    // 添加引用策略
    if (options.referrer) {
        other["referrer"] = options.referrer;
    } else {
        other["referrer"] = "origin-when-cross-origin";
    }

    // 添加作者信息
    if (options.author) {
        other["author"] = options.author.name;
        if (options.author.url) {
            other["author-url"] = options.author.url;
        }
    }

    // 添加发布者信息
    if (options.publisher) {
        other["publisher"] = options.publisher.name;
        if (options.publisher.url) {
            other["publisher-url"] = options.publisher.url;
        }
    }

    // favicon配置
    const faviconSource = context.settings.faviconUrl?.trim();
    const icons = faviconSource
        ? {
            icon: ensureAbsoluteUrl(faviconSource, context.appUrl),
            shortcut: ensureAbsoluteUrl(faviconSource, context.appUrl),
            apple: ensureAbsoluteUrl(faviconSource, context.appUrl),
        }
        : undefined;

    // 预加载配置
    const preloadResources = options.preload?.map((resource, index) => ({
        rel: "preload",
        href: resource.href,
        as: resource.as,
        type: resource.type,
        crossOrigin: resource.crossOrigin,
    }));

    // 合并预加载到other对象
    if (preloadResources && preloadResources.length > 0) {
        preloadResources.forEach((resource, index) => {
            other[`preload-${index}`] = `${resource.rel}; href=${resource.href}; as=${resource.as}${resource.type ? `; type=${resource.type}` : ""}${resource.crossOrigin ? `; crossorigin=${resource.crossOrigin}` : ""}`;
        });
    }

    // 构建最终的metadata对象
    const metadata: Metadata = {
        metadataBase: context.metadataBase,
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages: {
                ...languages,
                "x-default": buildLocalizedPath(defaultLocale, canonicalPath),
            },
        },
        openGraph,
        twitter,
        robots: options.robots ?? defaultRobots,
        icons,
        other: Object.keys(other).length > 0 ? other : undefined,
    };

    return metadata;
}

// 实用工具函数

/**
 * 创建文章类型的元数据
 */
export function createArticleMetadata(
    context: MetadataContext,
    options: Omit<CreateMetadataOptions, "openGraph" | "article"> & {
        article: CreateMetadataOptions["article"];
    }
): Metadata {
    return createMetadata(context, {
        ...options,
        openGraph: {
            type: "article",
        },
        article: options.article,
    });
}

/**
 * 创建产品页面元数据
 */
export function createProductMetadata(
    context: MetadataContext,
    options: Omit<CreateMetadataOptions, "openGraph"> & {
        productName: string;
        productDescription: string;
        price?: number;
        currency?: string;
        brand?: string;
        sku?: string;
        inStock?: boolean;
    }
): Metadata {
    return createMetadata(context, {
        title: options.productName,
        description: options.productDescription,
        category: "Product",
        openGraph: {
            type: "product",
            ...(options.price && options.currency && {
                product: {
                    price: options.price.toString(),
                    currency: options.currency,
                    availability: options.inStock
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    brand: options.brand,
                    sku: options.sku,
                },
            }),
        },
    });
}

/**
 * 创建服务页面元数据
 */
export function createServiceMetadata(
    context: MetadataContext,
    options: Omit<CreateMetadataOptions, "openGraph"> & {
        serviceName: string;
        serviceDescription: string;
        provider?: string;
        serviceType?: string;
    }
): Metadata {
    return createMetadata(context, {
        title: options.serviceName,
        description: options.serviceDescription,
        category: "Service",
        openGraph: {
            type: "website",
        },
        publisher: options.provider ? {
            name: options.provider,
        } : undefined,
    });
}

/**
 * 创建作者信息元数据
 */
export function createAuthorMetadata(
    context: MetadataContext,
    options: Omit<CreateMetadataOptions, "author"> & {
        authorName: string;
        authorBio?: string;
        authorImage?: string;
        authorUrl?: string;
    }
): Metadata {
    return createMetadata(context, {
        title: `${options.authorName} - ${context.settings.siteName || ""}`,
        description: options.authorBio || `了解更多关于${options.authorName}的信息`,
        author: {
            name: options.authorName,
            url: options.authorUrl,
            image: options.authorImage,
        },
        openGraph: {
            type: "profile",
            profile: {
                firstName: options.authorName.split(" ")[0],
                lastName: options.authorName.split(" ").slice(1).join(" "),
                username: options.authorName.toLowerCase().replace(/\s+/g, ""),
            },
        },
    });
}

/**
 * 预设的元数据模板
 */
export const MetadataPresets = {
    // 首页
    homepage: {
        preload: [
            {
                href: "/og-image.svg",
                as: "image",
                type: "image/svg+xml",
            },
        ],
    },

    // 博客文章
    blogPost: {
        category: "Article",
        preload: [
            {
                href: "/fonts/inter.woff2",
                as: "font",
                type: "font/woff2",
                crossOrigin: "anonymous",
            },
        ],
    },

    // 产品页面
    product: {
        category: "Product",
        preload: [
            {
                href: "/product-image.webp",
                as: "image",
                type: "image/webp",
            },
        ],
    },

    // 联系页面
    contact: {
        category: "Contact",
        preload: [],
    },

    // 关于页面
    about: {
        category: "About",
        preload: [
            {
                href: "/team-photo.webp",
                as: "image",
                type: "image/webp",
            },
        ],
    },
} as const;

/**
 * 元数据验证工具
 */
export class MetadataValidator {
    /**
     * 验证元数据长度
     */
    static validateTitle(title: string): { valid: boolean; warning?: string } {
        if (title.length < 30) {
            return {
                valid: true,
                warning: "标题长度较短，建议至少30个字符以获得更好的SEO效果"
            };
        }
        if (title.length > 60) {
            return {
                valid: true,
                warning: "标题长度过长，建议控制在60个字符以内以避免截断"
            };
        }
        return { valid: true };
    }

    /**
     * 验证描述长度
     */
    static validateDescription(description: string): { valid: boolean; warning?: string } {
        if (description.length < 120) {
            return {
                valid: true,
                warning: "描述长度较短，建议至少120个字符以获得更好的展示效果"
            };
        }
        if (description.length > 160) {
            return {
                valid: true,
                warning: "描述长度过长，建议控制在160个字符以内以避免截断"
            };
        }
        return { valid: true };
    }

    /**
     * 验证图片URL
     */
    static validateImageUrl(url: string): { valid: boolean; error?: string } {
        try {
            const urlObj = new URL(url);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'];
            const hasImageExtension = imageExtensions.some(ext =>
                urlObj.pathname.toLowerCase().endsWith(ext)
            );

            if (!hasImageExtension) {
                return {
                    valid: false,
                    error: "图片URL应该是有效的图片格式"
                };
            }

            return { valid: true };
        } catch {
            return {
                valid: false,
                error: "无效的图片URL格式"
            };
        }
    }

    /**
     * 验证完整元数据
     */
    static validateMetadata(metadata: {
        title?: string;
        description?: string;
        openGraph?: { images?: Array<{ url: string }> };
    }): { valid: boolean; warnings: string[]; errors: string[] } {
        const warnings: string[] = [];
        const errors: string[] = [];
        let valid = true;

        if (metadata.title) {
            const titleValidation = this.validateTitle(metadata.title);
            if (titleValidation.warning) warnings.push(titleValidation.warning);
        } else {
            errors.push("缺少页面标题");
            valid = false;
        }

        if (metadata.description) {
            const descValidation = this.validateDescription(metadata.description);
            if (descValidation.warning) warnings.push(descValidation.warning);
        } else {
            errors.push("缺少页面描述");
            valid = false;
        }

        if (metadata.openGraph?.images) {
            metadata.openGraph.images.forEach((image, index) => {
                const imageValidation = this.validateImageUrl(image.url);
                if (!imageValidation.valid && imageValidation.error) {
                    errors.push(`Open Graph图片${index + 1}: ${imageValidation.error}`);
                }
            });
        }

        return { valid, warnings, errors };
    }
}
