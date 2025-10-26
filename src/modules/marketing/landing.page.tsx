import type React from "react";

import { SkipLink } from "@/components/accessibility/skip-link";
import { Card, CardContent } from "@/components/ui/card";
import { serializeJsonLd } from "@/lib/seo/jsonld";
import type { MarketingSection } from "@/lib/static-config";

import type { PlaygroundMessages } from "./components/playground";
import Playground from "./components/playground-loader";
import PublicFooter, { type FooterMessages } from "./components/public-footer";
import PublicHeader, {
    type MarketingHeaderMessages,
} from "./components/public-header";
import { CtaSection } from "./sections/cta.section";
import { FaqSection } from "./sections/faq.section";
import { FeaturesSection } from "./sections/features.section";
import { HeroSection } from "./sections/hero.section";
import { TrustSection } from "./sections/trust.section";
import type {
    CtaSectionData,
    FaqSectionData,
    FeaturesSectionData,
    HeroSectionData,
    TrustSectionData,
    WhySectionItem,
} from "./sections/types";

type VariantSource = "query" | "cookie" | "default";

type MarketingLandingPageProps = {
    siteName?: string;
    marketingMessages: Record<string, unknown>;
    commonMessages: Record<string, unknown>;
    marketingSummary: {
        sections: Record<
            MarketingSection,
            {
                defaultVariant: string;
                structuredData?: Record<string, unknown> | Array<unknown>;
            }
        >;
        variants: Record<MarketingSection, string[]>;
    };
    heroData: HeroSectionData;
    featuresData: FeaturesSectionData;
    faqData: FaqSectionData;
    trustData: TrustSectionData;
    ctaData: CtaSectionData;
    whyItems: WhySectionItem[];
    whyTitle: string;
    variantSelections: Record<
        MarketingSection,
        { value: string; source: VariantSource }
    >;
};

function toArray(value: unknown): Record<string, unknown>[] {
    return Array.isArray(value)
        ? (value as Record<string, unknown>[])
        : ([] as Record<string, unknown>[]);
}

export default function MarketingLandingPage({
    siteName,
    marketingMessages,
    commonMessages,
    marketingSummary,
    heroData,
    featuresData,
    faqData,
    trustData,
    ctaData,
    whyItems,
    whyTitle,
    variantSelections,
}: MarketingLandingPageProps) {
    const headerMessages = marketingMessages.header as MarketingHeaderMessages;
    const playgroundMessages =
        marketingMessages.playground as PlaygroundMessages;
    const footerMessages = marketingMessages.footer as FooterMessages;
    const resolvedSiteName = siteName?.trim().length
        ? siteName.trim()
        : undefined;
    const heroStructuredData = toArray(
        marketingSummary.sections.hero.structuredData ?? [],
    );

    const structuredDataPayload = heroStructuredData;

    const appName =
        typeof commonMessages.appName === "string"
            ? commonMessages.appName
            : (resolvedSiteName ?? "Banana Generator");
    const brandTagline =
        typeof commonMessages.brandTagline === "string"
            ? commonMessages.brandTagline
            : "";

    const variantSummary = Object.entries(variantSelections)
        .map(([section, info]) => `${section}:${info.value}(${info.source})`)
        .join(", ");

    console.info(`[marketing] variant selection -> ${variantSummary}`);

    return (
        <div
            className="bg-background text-foreground"
            style={
                {
                    "--card-header-gap": "0.5rem",
                    "--token-font-family-sans": "var(--font-inter)",
                    "--background": "#000000",
                    "--foreground": "#fefce8",
                    "--border": "#facc15",
                    "--primary": "var(--token-color-accent)",
                    "--button-bg": "var(--token-color-accent)",
                    "--button-fg": "#000",
                    "--button-hover-bg":
                        "color-mix(in oklch, var(--token-color-accent) 85%, black 15%)",
                    "--accent": "var(--token-color-accent)",
                    "--accent-foreground": "#000",
                    fontFamily: "var(--token-font-family-sans)",
                } as React.CSSProperties
            }
        >
            <SkipLink />
            <PublicHeader marketingHeaderMessages={headerMessages} />

            <main id="main-content" tabIndex={-1}>
                <HeroSection data={heroData} />

                <section
                    id="playground"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] pb-12"
                    aria-labelledby="playground-heading"
                >
                    <header className="mb-8 text-center">
                        <h2 id="playground-heading" className="sr-only">
                            AI Photo Editor Playground
                        </h2>
                    </header>
                    <main>
                        <Playground messages={playgroundMessages} />
                    </main>
                </section>

                <FeaturesSection data={featuresData} />

                <section
                    id="why"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="mb-6 text-center font-bold text-subtitle">
                        {whyTitle}
                    </h2>
                    <div className="grid xs:grid-cols-2 gap-4 lg-narrow:grid-cols-3">
                        {whyItems.map((item) => (
                            <Card
                                key={item.title}
                                className="border-yellow-400/20 bg-black/40"
                            >
                                <CardContent className="p-4">
                                    <h3 className="mb-1 font-semibold">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-yellow-200/80">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <FaqSection data={faqData} />
                <TrustSection data={trustData} />
                <CtaSection data={ctaData} />
            </main>

            <PublicFooter
                appName={appName}
                brandTagline={brandTagline}
                footerMessages={footerMessages}
            />
            <script
                id="marketing-structured-data"
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data must be inlined as JSON-LD
                dangerouslySetInnerHTML={{
                    __html: serializeJsonLd(structuredDataPayload),
                }}
            />
        </div>
    );
}
