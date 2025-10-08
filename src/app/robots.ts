import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { MetadataRoute } from "next";

import { resolveAppUrl } from "@/lib/seo";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

export default async function robots(): Promise<MetadataRoute.Robots | string> {
    const settings = await getSiteSettingsPayload();
    let envAppUrl: string | undefined;
    try {
        const { env } = await getCloudflareContext({ async: true });
        envAppUrl = env.NEXT_PUBLIC_APP_URL;
    } catch (error) {
        console.warn("Falling back to process env for robots", { error });
        envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    }
    const baseUrl = resolveAppUrl(settings, {
        envAppUrl,
    });
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const sitemapEnabled = Boolean(settings.sitemapEnabled);
    const customRules = settings.robotsRules?.trim();
    if (customRules) {
        const normalized = customRules.replace(/\r?\n/g, "\n").trim();
        if (!sitemapEnabled) {
            return normalized;
        }
        return /sitemap:/i.test(normalized)
            ? normalized
            : `${normalized}\nSitemap: ${sitemapUrl}`;
    }
    const rules: MetadataRoute.Robots = {
        rules: {
            userAgent: "*",
            allow: "/",
        },
    };
    if (sitemapEnabled) {
        rules.sitemap = sitemapUrl;
    }
    try {
        rules.host = new URL(baseUrl).host;
    } catch (error) {
        console.warn("Failed to derive robots host", { error });
    }
    return rules;
}
