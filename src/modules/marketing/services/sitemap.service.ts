import { type AppLocale, getSupportedAppLocales } from "@/i18n/config";
import type { SitemapEntryConfig } from "@/lib/sitemap";

const SUPPORTED_LANGUAGES = getSupportedAppLocales();

function buildLocalizedPaths(path: string): Partial<Record<AppLocale, string>> {
    return SUPPORTED_LANGUAGES.reduce(
        (acc, locale) => {
            acc[locale] = path;
            return acc;
        },
        {} as Partial<Record<AppLocale, string>>,
    );
}

export async function getMarketingSitemapEntries(): Promise<
    SitemapEntryConfig[]
> {
    const marketingPages: SitemapEntryConfig[] = [
        {
            path: "/",
            changeFrequency: "daily",
            priority: 1,
            localizedPaths: buildLocalizedPaths("/"),
        },
        {
            path: "/billing",
            changeFrequency: "weekly",
            priority: 0.7,
            localizedPaths: buildLocalizedPaths("/billing"),
        },
        {
            path: "/about",
            changeFrequency: "monthly",
            priority: 0.6,
            localizedPaths: buildLocalizedPaths("/about"),
        },
        {
            path: "/contact",
            changeFrequency: "monthly",
            priority: 0.6,
            localizedPaths: buildLocalizedPaths("/contact"),
        },
        {
            path: "/privacy",
            changeFrequency: "yearly",
            priority: 0.5,
            localizedPaths: buildLocalizedPaths("/privacy"),
        },
        {
            path: "/terms",
            changeFrequency: "yearly",
            priority: 0.5,
            localizedPaths: buildLocalizedPaths("/terms"),
        },
    ];
    return marketingPages;
}
