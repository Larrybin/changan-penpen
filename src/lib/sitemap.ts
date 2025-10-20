import type { MetadataRoute } from "next";
import type { AppLocale } from "@/i18n/config";

export type SitemapEntryConfig = {
    path: string;
    priority?: number;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified?: Date;
    localizedPaths?: Partial<Record<AppLocale, string>>;
};

type Loader = () => Promise<SitemapEntryConfig[]>;

async function tryLoadMarketingEntries(): Promise<SitemapEntryConfig[]> {
    try {
        const module = await import(
            "@/modules/marketing/services/sitemap.service"
        );
        if (typeof module.getMarketingSitemapEntries === "function") {
            return module.getMarketingSitemapEntries();
        }
    } catch (error) {
        console.warn("Marketing sitemap entries loader failed", { error });
    }
    return [];
}

export async function getDynamicSitemapEntries(): Promise<
    SitemapEntryConfig[]
> {
    const loaders: Loader[] = [tryLoadMarketingEntries];
    const entries: SitemapEntryConfig[] = [];
    for (const loader of loaders) {
        const result = await loader();
        if (Array.isArray(result) && result.length) {
            entries.push(...result);
        }
    }
    return entries;
}
