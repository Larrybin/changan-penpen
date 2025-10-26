import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { resolveAppLocale } from "@/i18n/config";
import {
    loadMarketingSection,
    loadStaticConfig,
    MARKETING_SECTIONS,
    type MarketingSection,
    type MarketingSectionFile,
} from "@/lib/static-config";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import MarketingLandingPage from "@/modules/marketing/landing.page";
import type {
    CtaSectionData,
    FaqSectionData,
    FeaturesSectionData,
    HeroSectionData,
    TrustSectionData,
    WhySectionItem,
} from "@/modules/marketing/sections/types";
import { resolveMarketingVariant } from "@/modules/marketing/utils/variant";

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

type VariantSelection = Record<
    MarketingSection,
    {
        value: string;
        source: "query" | "cookie" | "default";
    }
>;

function pickVariant<T>(file: MarketingSectionFile, variant: string): T {
    const candidate =
        file.variants?.[variant] ?? file.variants?.[file.defaultVariant];
    if (!candidate) {
        throw new Error("Missing marketing section variant data");
    }
    return candidate as T;
}

export default async function HomePage({ searchParams }: PageProps) {
    const locale = resolveAppLocale(await getLocale());
    const settings = await getSiteSettingsPayload();
    const siteName = settings.siteName?.trim().length
        ? settings.siteName.trim()
        : undefined;

    const staticConfig = await loadStaticConfig(locale);
    const sectionFiles = await Promise.all(
        MARKETING_SECTIONS.map(
            async (section) =>
                [section, await loadMarketingSection(locale, section)] as const,
        ),
    );
    const sectionMap = Object.fromEntries(sectionFiles) as Record<
        MarketingSection,
        MarketingSectionFile
    >;

    const cookieStore = await cookies();
    const variantSelections: VariantSelection = {} as VariantSelection;
    for (const section of MARKETING_SECTIONS) {
        const variants = staticConfig.marketing.variants[section] ?? [];
        const summary = staticConfig.marketing.sections[section];
        const selection = resolveMarketingVariant({
            section,
            availableVariants: variants,
            defaultVariant: summary.defaultVariant,
            searchParams,
            cookies: cookieStore,
        });
        variantSelections[section] = selection;
    }

    const heroData = pickVariant<HeroSectionData>(
        sectionMap.hero,
        variantSelections.hero.value,
    );
    const featuresData = pickVariant<FeaturesSectionData>(
        sectionMap.features,
        variantSelections.features.value,
    );
    const faqData = pickVariant<FaqSectionData>(
        sectionMap.faq,
        variantSelections.faq.value,
    );
    const trustData = pickVariant<TrustSectionData>(
        sectionMap.trust,
        variantSelections.trust.value,
    );
    const ctaData = pickVariant<CtaSectionData>(
        sectionMap.cta,
        variantSelections.cta.value,
    );

    const marketingMessages = staticConfig.messages.Marketing as Record<
        string,
        unknown
    >;
    const commonMessages = staticConfig.messages.Common as Record<
        string,
        unknown
    >;
    const whyNamespace = marketingMessages.why as {
        title?: string;
        items?: WhySectionItem[];
    };
    const whyItems = Array.isArray(whyNamespace?.items)
        ? (whyNamespace?.items as WhySectionItem[])
        : [];
    const whyTitle =
        typeof whyNamespace?.title === "string"
            ? whyNamespace.title
            : "Why Choose Us";

    return (
        <MarketingLandingPage
            siteName={siteName}
            marketingMessages={marketingMessages}
            commonMessages={commonMessages}
            marketingSummary={staticConfig.marketing}
            heroData={heroData}
            featuresData={featuresData}
            faqData={faqData}
            trustData={trustData}
            ctaData={ctaData}
            whyItems={whyItems}
            whyTitle={whyTitle}
            variantSelections={variantSelections}
        />
    );
}
