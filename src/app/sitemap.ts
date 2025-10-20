import { NextResponse } from "next/server";

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

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

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
): string {
    if (entry.changeFrequency) {
        return entry.changeFrequency;
    }
    return normalizedPath === "/" ? "daily" : "weekly";
}

function formatPriority(entry: RouteConfig): string {
    const priority = entry.priority ?? (entry.path === "/" ? 1 : 0.6);
    return priority % 1 === 0 ? String(priority) : priority.toFixed(1);
}

export default async function sitemap(): Promise<Response> {
    const settings = await getSiteSettingsPayload();
    if (!settings.sitemapEnabled) {
        const empty = `${XML_HEADER}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"></urlset>`;
        return new NextResponse(empty, {
            headers: { "Content-Type": "application/xml; charset=UTF-8" },
        });
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
    const urlFragments: string[] = [];

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

        for (const { href, normalized } of localizedAlternates) {
            const alternatesMarkup = localizedAlternates
                .map(
                    (alternate) =>
                        `<xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${alternate.href}" />`,
                )
                .join("");
            const xDefaultMarkup = `<xhtml:link rel="alternate" hreflang="x-default" href="${defaultAlternate?.href ?? href}" />`;
            const lastMod = (entry.lastModified ?? now).toISOString();
            const changefreq = formatChangeFrequency(entry, normalized);
            const priority = formatPriority(entry);
            urlFragments.push(
                [
                    "<url>",
                    `<loc>${href}</loc>`,
                    `<lastmod>${lastMod}</lastmod>`,
                    `<changefreq>${changefreq}</changefreq>`,
                    `<priority>${priority}</priority>`,
                    alternatesMarkup,
                    xDefaultMarkup,
                    "</url>",
                ].join(""),
            );
        }
    }

    const xml = [
        XML_HEADER,
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urlFragments,
        "</urlset>",
    ].join("");

    return new NextResponse(xml, {
        headers: { "Content-Type": "application/xml; charset=UTF-8" },
    });
}
