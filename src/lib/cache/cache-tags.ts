import type { AppLocale } from "@/i18n/config";
import type { MarketingSection } from "@/lib/static-config";

export const CACHE_TAGS = {
    siteSettings: "site-settings",
    staticConfig(locale: AppLocale) {
        return `static-config:${locale}`;
    },
    marketingSection(locale: AppLocale, section: MarketingSection) {
        return `marketing-section:${locale}:${section}`;
    },
    optimizationProgress: "optimization-progress",
} as const;

export type CacheTagGenerator = typeof CACHE_TAGS;
