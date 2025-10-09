import { getCloudflareContext } from "@opennextjs/cloudflare";
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

export async function getMetadataContext(
    locale: AppLocale,
): Promise<MetadataContext> {
    const [cloudflareContext, settings, messagesModule] = await Promise.all([
        getCloudflareContext({ async: true }),
        getSiteSettingsPayload(),
        import(`@/i18n/messages/${locale}.json`) as Promise<MetadataBundle>,
    ]);
    const { env } = cloudflareContext;
    const metadataMessages = messagesModule.Metadata;
    const appUrl = resolveAppUrl(settings, {
        envAppUrl: env.NEXT_PUBLIC_APP_URL,
    });
    let metadataBase: URL | undefined;
    try {
        metadataBase = new URL(appUrl);
    } catch (error) {
        console.warn("Failed to construct metadata base", { error });
        metadataBase = undefined;
    }
    const shareImageSource = settings.seoOgImage?.trim().length
        ? settings.seoOgImage.trim()
        : "/og-image.svg";
    const shareImage = ensureAbsoluteUrl(shareImageSource, appUrl);
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
    const fallbackTitle = context.settings.seoTitle?.trim().length
        ? context.settings.seoTitle.trim()
        : context.messages.title;
    const fallbackDescription = context.settings.seoDescription?.trim().length
        ? context.settings.seoDescription.trim()
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
    const openGraph = options.openGraph
        ? {
              ...baseOpenGraph,
              ...options.openGraph,
              images: options.openGraph.images ?? baseOpenGraph.images,
          }
        : baseOpenGraph;
    const baseTwitter: NonNullable<Metadata["twitter"]> = {
        card: "summary_large_image",
        title,
        description,
        images: [
            {
                url: context.shareImage,
                alt: twitterAlt,
            },
        ],
    };
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
    const faviconSource = context.settings.faviconUrl?.trim();
    const icons = faviconSource
        ? { icon: ensureAbsoluteUrl(faviconSource, context.appUrl) }
        : undefined;
    return {
        metadataBase: context.metadataBase,
        title,
        description,
        keywords,
        alternates: {
            canonical,
            languages,
        },
        openGraph,
        twitter,
        robots: options.robots ?? defaultRobots,
        icons,
    } satisfies Metadata;
}
