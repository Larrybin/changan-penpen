import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { MetadataRoute } from "next";

import {
    buildLocalizedPath,
    getActiveAppLocales,
    resolveAppUrl,
} from "@/lib/seo";
import { getDynamicSitemapEntries } from "@/lib/sitemap";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

type RouteConfig = {
    path: string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
    lastModified?: Date;
};

const staticRoutes: RouteConfig[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/billing", changeFrequency: "weekly", priority: 0.6 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
];

function normalizePath(path: string): string {
    if (!path || path === "/") {
        return "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const settings = await getSiteSettingsPayload();
    if (!settings.sitemapEnabled) {
        return [];
    }
    const [dynamicEntries] = await Promise.all([getDynamicSitemapEntries()]);

    let envAppUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL;
    if (!envAppUrl) {
        try {
            const { env } = await getCloudflareContext({ async: true });
            envAppUrl = env.NEXT_PUBLIC_APP_URL;
        } catch (_error) {
            envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
        }
    }

    const baseUrl = resolveAppUrl(settings, {
        envAppUrl,
    });
    const locales = getActiveAppLocales(settings);
    const now = new Date();
    const routeConfigs = [...staticRoutes, ...dynamicEntries];
    const seen = new Set<string>();
    return routeConfigs.flatMap((entry) => {
        const normalizedPath = normalizePath(entry.path);
        if (seen.has(normalizedPath)) {
            return [] as MetadataRoute.Sitemap;
        }
        seen.add(normalizedPath);
        return locales.map((locale) => {
            const localizedPath = buildLocalizedPath(locale, normalizedPath);
            const absoluteUrl =
                localizedPath === "/" ? baseUrl : `${baseUrl}${localizedPath}`;
            return {
                url: absoluteUrl,
                lastModified: entry.lastModified ?? now,
                changeFrequency:
                    entry.changeFrequency ??
                    (normalizedPath === "/" ? "daily" : "weekly"),
                priority: entry.priority ?? (normalizedPath === "/" ? 1 : 0.6),
            } satisfies MetadataRoute.Sitemap[number];
        });
    });
}
