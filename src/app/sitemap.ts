import type { MetadataRoute } from "next";

import {
    buildLocalizedPath,
    getActiveAppLocales,
    resolveAppUrl,
} from "@/lib/seo";
import {
    getDynamicSitemapEntries,
    type SitemapEntryConfig,
} from "@/lib/sitemap";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const staticRoutes: SitemapEntryConfig[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/billing", changeFrequency: "weekly", priority: 0.6 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
];

type RouteConfig = SitemapEntryConfig;

function normalizePath(path: string): string {
    if (!path || path === "/") {
        return "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
}

function formatChangeFrequency(
    entry: RouteConfig,
    normalizedPath: string,
): MetadataRoute.Sitemap[number]["changeFrequency"] {
    if (entry.changeFrequency) {
        return entry.changeFrequency;
    }
    return normalizedPath === "/" ? "daily" : "weekly";
}

function formatPriority(entry: RouteConfig): number {
    return entry.priority ?? (entry.path === "/" ? 1 : 0.6);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const settings = await getSiteSettingsPayload();
    if (!settings.sitemapEnabled) {
        return [];
    }

    const [dynamicEntries] = await Promise.all([getDynamicSitemapEntries()]);
    const envAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl = resolveAppUrl(settings, { envAppUrl });
    const locales = getActiveAppLocales(settings);
    const defaultLocale = settings.defaultLanguage;
    const routeConfigs: RouteConfig[] = [...staticRoutes, ...dynamicEntries];
    const seen = new Set<string>();
    const uniqueEntries = routeConfigs.filter((entry) => {
        const normalized = normalizePath(entry.path);
        if (seen.has(normalized)) {
            return false;
        }
        seen.add(normalized);
        return true;
    });

    const now = new Date();
    const entries: MetadataRoute.Sitemap = [];

    for (const entry of uniqueEntries) {
        const localizedAlternates = locales.map((locale) => {
            const localizedBase = entry.localizedPaths?.[locale] ?? entry.path;
            const normalized = normalizePath(localizedBase);
            const localizedPath = buildLocalizedPath(locale, normalized);
            const href =
                localizedPath === "/" ? baseUrl : `${baseUrl}${localizedPath}`;
            return { locale, normalized, href };
        });
        const defaultAlternate =
            localizedAlternates.find((item) => item.locale === defaultLocale) ??
            localizedAlternates[0];

        const languages: Record<string, string> = {};
        for (const alternate of localizedAlternates) {
            languages[alternate.locale] = alternate.href;
        }
        if (defaultAlternate) {
            languages["x-default"] = defaultAlternate.href;
        }

        for (const { href, normalized } of localizedAlternates) {
            entries.push({
                url: href,
                lastModified: entry.lastModified ?? now,
                changeFrequency: formatChangeFrequency(entry, normalized),
                priority: formatPriority(entry),
                alternates: {
                    languages,
                },
            });
        }
    }

    return entries;
}
