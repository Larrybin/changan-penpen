import type { SitemapEntryConfig } from "@/lib/sitemap";

export async function getMarketingSitemapEntries(): Promise<
    SitemapEntryConfig[]
> {
    const marketingPages: SitemapEntryConfig[] = [
        {
            path: "/",
            changeFrequency: "daily",
            priority: 1,
        },
        {
            path: "/billing",
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            path: "/about",
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            path: "/contact",
            changeFrequency: "monthly",
            priority: 0.6,
        },
        {
            path: "/privacy",
            changeFrequency: "yearly",
            priority: 0.5,
        },
        {
            path: "/terms",
            changeFrequency: "yearly",
            priority: 0.5,
        },
    ];
    return marketingPages;
}
