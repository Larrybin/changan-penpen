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
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type CanonicalInfo = {
    canonical: string;
    languages: Record<string, string>;
    absoluteCanonical: string;
    defaultCanonical: string;
};

function resolveCanonicalInfo(
    context: MetadataContext,
    path?: string,
): CanonicalInfo {
    const canonicalPath = ensureLeadingSlash(path ?? "/");
    const canonical = buildLocalizedPath(context.locale, canonicalPath);
    const languages = context.activeLocales.reduce(
        (acc, locale) => {
            acc[locale] = buildLocalizedPath(locale, canonicalPath);
            return acc;
        },
        {} as Record<string, string>,
    );
    const absoluteCanonical =
        canonical === "/" ? context.appUrl : `${context.appUrl}${canonical}`;
    const defaultCanonical = buildLocalizedPath(
        context.settings.defaultLanguage,
        canonicalPath,
    );

    return {
        canonical,
        languages,
        absoluteCanonical,
        defaultCanonical,
    };
}

type CoreMetadataContent = {
    title: string;
    description: string;
    keywords: string[];
    siteName: string;
    openGraphAlt: string;
    twitterAlt: string;
};

function resolveContent(
    context: MetadataContext,
    options: CreateMetadataOptions,
): CoreMetadataContent {
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

    return { title, description, keywords, siteName, openGraphAlt, twitterAlt };
}

type OpenGraphInput = CoreMetadataContent & {
    context: MetadataContext;
    options: CreateMetadataOptions;
    absoluteCanonical: string;
};

function trimToLength(value: string, max: number): string {
    const normalized = value.trim();
    if (normalized.length <= max) {
        return normalized;
    }
    return normalized.slice(0, max);
}

function resolveShareImageUrl(
    context: MetadataContext,
    content: CoreMetadataContent,
    options: CreateMetadataOptions,
    canonicalInfo: CanonicalInfo,
): string {
    const hasCustomImages = Boolean(
        options.openGraph?.images?.length || options.twitter?.images?.length,
    );

    if (hasCustomImages) {
        return context.shareImage;
    }

    const params = new URLSearchParams();
    params.set("title", trimToLength(content.title, 120));
    params.set("description", trimToLength(content.description, 200));
    params.set("locale", context.locale);

    const siteName = context.settings.siteName?.trim().length
        ? context.settings.siteName.trim()
        : content.siteName;
    params.set("siteName", trimToLength(siteName, 80));

    if (options.path) {
        params.set("path", canonicalInfo.canonical);
    }

    return ensureAbsoluteUrl(
        `/opengraph-image?${params.toString()}`,
        context.appUrl,
    );
}

type TypedOpenGraph = Extract<
    NonNullable<Metadata["openGraph"]>,
    { type: string }
>;

type OpenGraphWithAuthors = Extract<
    NonNullable<Metadata["openGraph"]>,
    { authors?: unknown }
>;

function hasOpenGraphType(
    value: NonNullable<Metadata["openGraph"]>,
): value is TypedOpenGraph {
    return typeof (value as { type?: unknown }).type === "string";
}

function hasOpenGraphAuthors(
    value: NonNullable<Metadata["openGraph"]>,
): value is OpenGraphWithAuthors {
    return "authors" in value;
}

function collectAuthorCandidates(
    openGraph: NonNullable<Metadata["openGraph"]>,
    article: CreateMetadataOptions["article"],
    author: CreateMetadataOptions["author"],
): string[] {
    const candidates = new Set<string>();

    if (
        hasOpenGraphType(openGraph) &&
        hasOpenGraphAuthors(openGraph) &&
        (openGraph.type === "article" || openGraph.type === "book")
    ) {
        const value = openGraph.authors;
        if (value) {
            const addAuthor = (entry: string | URL) => {
                const asString =
                    entry instanceof URL ? entry.toString() : entry;
                const trimmed = asString.trim();
                if (trimmed.length) {
                    candidates.add(trimmed);
                }
            };

            if (Array.isArray(value)) {
                value.forEach(addAuthor);
            } else {
                addAuthor(value);
            }
        }
    }

    article?.authors?.forEach((entry) => {
        const trimmed = entry.trim();
        if (trimmed.length) {
            candidates.add(trimmed);
        }
    });

    const authorName = author?.name.trim();
    if (authorName) {
        candidates.add(authorName);
    }

    return Array.from(candidates);
}

function mergeArticleOpenGraph(
    openGraph: NonNullable<Metadata["openGraph"]>,
    options: CreateMetadataOptions,
): NonNullable<Metadata["openGraph"]> {
    let enriched: NonNullable<Metadata["openGraph"]> = openGraph;

    if (options.article) {
        const { publishedTime, modifiedTime, section, tags } = options.article;
        enriched = {
            ...enriched,
            type: "article",
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
            ...(section ? { section } : {}),
            ...(tags?.length ? { tags } : {}),
        };
    }

    const mergedAuthors = collectAuthorCandidates(
        enriched,
        options.article,
        options.author,
    );

    if (
        mergedAuthors.length > 0 &&
        hasOpenGraphType(enriched) &&
        (enriched.type === "article" || enriched.type === "book")
    ) {
        enriched = {
            ...enriched,
            authors: mergedAuthors,
        } as Extract<
            NonNullable<Metadata["openGraph"]>,
            { type: "article" | "book" }
        >;
    }

    return enriched;
}

function buildOpenGraphMetadata({
    context,
    options,
    title,
    description,
    siteName,
    openGraphAlt,
    absoluteCanonical,
}: OpenGraphInput): NonNullable<Metadata["openGraph"]> {
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

    const mergedOpenGraph = options.openGraph
        ? {
              ...baseOpenGraph,
              ...options.openGraph,
              images: options.openGraph.images ?? baseOpenGraph.images,
          }
        : baseOpenGraph;

    return mergeArticleOpenGraph(mergedOpenGraph, options);
}

type TwitterInput = CoreMetadataContent & {
    context: MetadataContext;
    options: CreateMetadataOptions;
};

function buildTwitterMetadata({
    context,
    options,
    title,
    description,
    twitterAlt,
}: TwitterInput): NonNullable<Metadata["twitter"]> {
    const baseTwitter: NonNullable<Metadata["twitter"]> = {
        card: "summary_large_image",
        title,
        description,
        site:
            context.settings.siteName?.trim() ||
            context.messages.openGraph.siteName,
        ...(options.creator ? { creator: options.creator } : {}),
        images: [
            {
                url: context.shareImage,
                alt: twitterAlt,
                width: 1200,
                height: 630,
            },
        ],
    };

    if (options.article) {
        baseTwitter.card = "summary_large_image";
    }

    return options.twitter
        ? {
              ...baseTwitter,
              ...options.twitter,
              images: options.twitter.images ?? baseTwitter.images,
              title: options.twitter.title ?? baseTwitter.title,
              description:
                  options.twitter.description ?? baseTwitter.description,
          }
        : baseTwitter;
}

type OtherMetadataInput = {
    context: MetadataContext;
    options: CreateMetadataOptions;
};

function buildPreloadEntries(
    preload?: CreateMetadataOptions["preload"],
): Record<string, string> {
    if (!preload?.length) {
        return {};
    }

    return preload.reduce(
        (acc, resource, index) => {
            acc[`preload-${index}`] =
                `preload; href=${resource.href}; as=${resource.as}` +
                (resource.type ? `; type=${resource.type}` : "") +
                (resource.crossOrigin
                    ? `; crossorigin=${resource.crossOrigin}`
                    : "");
            return acc;
        },
        {} as Record<string, string>,
    );
}

function buildOtherMetadata({
    context,
    options,
}: OtherMetadataInput): Record<string, string> {
    const other: Record<string, string> = {};

    if (options.category) {
        other.category = options.category;
    }

    other.generator = options.generator ?? "Next.js 15";

    if (options.applicationName) {
        other["application-name"] = options.applicationName;
    } else if (context.settings.siteName) {
        other["application-name"] = context.settings.siteName;
    }

    other.referrer = options.referrer ?? "origin-when-cross-origin";

    if (options.author) {
        other.author = options.author.name;
        if (options.author.url) {
            other["author-url"] = options.author.url;
        }
    }

    if (options.publisher) {
        other.publisher = options.publisher.name;
        if (options.publisher.url) {
            other["publisher-url"] = options.publisher.url;
        }
    }

    if (options.structuredData) {
        other["structured-data"] = JSON.stringify(options.structuredData);
    }

    return {
        ...other,
        ...buildPreloadEntries(options.preload),
    };
}

function resolveIcons(context: MetadataContext): Metadata["icons"] {
    const faviconSource = context.settings.faviconUrl?.trim();
    if (!faviconSource) {
        return undefined;
    }

    const absolute = ensureAbsoluteUrl(faviconSource, context.appUrl);
    return {
        icon: absolute,
        shortcut: absolute,
        apple: absolute,
    };
}

export function createMetadata(
    context: MetadataContext,
    options: CreateMetadataOptions = {},
): Metadata {
    const canonicalInfo = resolveCanonicalInfo(context, options.path);
    const content = resolveContent(context, options);
    const shareImageUrl = resolveShareImageUrl(
        context,
        content,
        options,
        canonicalInfo,
    );
    const shareImageContext: MetadataContext = {
        ...context,
        shareImage: shareImageUrl,
    };
    const openGraph = buildOpenGraphMetadata({
        context: shareImageContext,
        options,
        ...content,
        absoluteCanonical: canonicalInfo.absoluteCanonical,
    });
    const twitter = buildTwitterMetadata({
        context: shareImageContext,
        options,
        ...content,
    });
    const other = buildOtherMetadata({ context, options });
    const icons = resolveIcons(context);

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

    const metadata: Metadata = {
        metadataBase: context.metadataBase,
        title: content.title,
        description: content.description,
        keywords: content.keywords,
        alternates: {
            canonical: canonicalInfo.canonical,
            languages: {
                ...canonicalInfo.languages,
                "x-default": canonicalInfo.defaultCanonical,
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
    },
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
    },
): Metadata {
    return createMetadata(context, {
        title: options.productName,
        description: options.productDescription,
        category: "Product",
        openGraph: {
            type: "website",
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
    },
): Metadata {
    return createMetadata(context, {
        title: options.serviceName,
        description: options.serviceDescription,
        category: "Service",
        openGraph: {
            type: "website",
        },
        publisher: options.provider
            ? {
                  name: options.provider,
              }
            : undefined,
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
    },
): Metadata {
    const [firstNameRaw, ...rest] = options.authorName.trim().split(/\s+/);
    const firstName = firstNameRaw || options.authorName;
    const lastName = rest.join(" ");
    const username = options.authorName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

    return createMetadata(context, {
        title: `${options.authorName} - ${context.settings.siteName || ""}`,
        description:
            options.authorBio || `了解更多关于${options.authorName}的信息`,
        author: {
            name: options.authorName,
            url: options.authorUrl,
            image: options.authorImage,
        },
        openGraph: {
            type: "profile",
            firstName,
            ...(lastName ? { lastName } : {}),
            username,
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
function validateTitle(title: string): { valid: boolean; warning?: string } {
    if (title.length < 30) {
        return {
            valid: true,
            warning: "标题长度较短，建议至少30个字符以获得更好的SEO效果",
        };
    }
    if (title.length > 60) {
        return {
            valid: true,
            warning: "标题长度过长，建议控制在60个字符以内以避免截断",
        };
    }
    return { valid: true };
}

function validateDescription(description: string): {
    valid: boolean;
    warning?: string;
} {
    if (description.length < 120) {
        return {
            valid: true,
            warning: "描述长度较短，建议至少120个字符以获得更好的展示效果",
        };
    }
    if (description.length > 160) {
        return {
            valid: true,
            warning: "描述长度过长，建议控制在160个字符以内以避免截断",
        };
    }
    return { valid: true };
}

function validateImageUrl(url: string): { valid: boolean; error?: string } {
    try {
        const urlObj = new URL(url);
        const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".avif",
            ".svg",
        ];
        const hasImageExtension = imageExtensions.some((ext) =>
            urlObj.pathname.toLowerCase().endsWith(ext),
        );

        if (!hasImageExtension) {
            return {
                valid: false,
                error: "图片URL应该是有效的图片格式",
            };
        }

        return { valid: true };
    } catch {
        return {
            valid: false,
            error: "无效的图片URL格式",
        };
    }
}

function validateMetadata(metadata: {
    title?: string;
    description?: string;
    openGraph?: { images?: Array<{ url: string }> };
}): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let valid = true;

    if (metadata.title) {
        const titleValidation = validateTitle(metadata.title);
        if (titleValidation.warning) warnings.push(titleValidation.warning);
    } else {
        errors.push("缺少页面标题");
        valid = false;
    }

    if (metadata.description) {
        const descValidation = validateDescription(metadata.description);
        if (descValidation.warning) warnings.push(descValidation.warning);
    } else {
        errors.push("缺少页面描述");
        valid = false;
    }

    metadata.openGraph?.images?.forEach((image, index) => {
        const imageValidation = validateImageUrl(image.url);
        if (!imageValidation.valid && imageValidation.error) {
            errors.push(`Open Graph图片${index + 1}: ${imageValidation.error}`);
        }
    });

    return { valid, warnings, errors };
}

export const MetadataValidator = {
    validateTitle,
    validateDescription,
    validateImageUrl,
    validateMetadata,
};
