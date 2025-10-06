import Link from "next/link";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AppLocale } from "@/i18n/config";
import { localeCurrencyMap } from "@/lib/seo";
import Playground from "./components/playground";
import PublicFooter from "./components/public-footer";
import PublicHeader from "./components/public-header";

type MarketingLandingPageProps = {
    appUrl: string;
    structuredDataImage: string;
    siteName?: string;
};

export default function MarketingLandingPage({
    appUrl,
    structuredDataImage,
    siteName,
}: MarketingLandingPageProps) {
    const t = useTranslations("Marketing");
    const locale = useLocale();
    const resolvedSiteName = siteName?.trim().length
        ? siteName.trim()
        : t("structuredData.name");
    const features = t.raw("features.items") as Array<{
        title: string;
        description: string;
    }>;
    const whyItems = t.raw("why.items") as Array<{
        title: string;
        description: string;
    }>;
    const faqItems = t.raw("faq.items") as Array<{
        question: string;
        answer: string;
    }>;
    const heroSupport = t.raw("hero.support") as Record<string, string>;
    const heroSupportValues = Object.values(heroSupport);
    const localeKey = (locale as AppLocale) ?? "en";
    const currency = localeCurrencyMap[localeKey] ?? localeCurrencyMap.en;
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: t("structuredData.name"),
        url: appUrl,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        description: t("structuredData.description"),
        featureList: t.raw("structuredData.featureList") as string[],
        image: structuredDataImage,
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: currency,
        },
        inLanguage: locale,
        alternateName: t("hero.title"),
        slogan: t("structuredData.tagline"),
        publisher: {
            "@type": "Organization",
            name: resolvedSiteName,
            url: appUrl,
            logo: {
                "@type": "ImageObject",
                url: structuredDataImage,
            },
        },
    };
    return (
        <div
            className="bg-background text-foreground"
            style={
                {
                    "--card-header-gap": "0.5rem",
                    "--token-font-family-sans": "var(--font-inter)",
                    // Marketing palette override via tokens
                    "--background": "#000000",
                    "--foreground": "#fefce8",
                    "--border": "#facc15",
                    "--primary": "var(--token-color-accent)",
                    // Button tokens for default variant
                    "--button-bg": "var(--token-color-accent)",
                    "--button-fg": "#000",
                    "--button-hover-bg":
                        "color-mix(in oklch, var(--token-color-accent) 85%, black 15%)",
                    // Accent used by outline variant
                    "--accent": "var(--token-color-accent)",
                    "--accent-foreground": "#000",
                    fontFamily: "var(--token-font-family-sans)",
                } as React.CSSProperties
            }
        >
            <PublicHeader />

            <main>
                <section className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-12 md:py-16">
                    <div className="grid xs:grid-cols-2 gap-[var(--grid-gap-section)] items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-yellow-400 text-black">
                                    {t("hero.badge")}
                                </Badge>
                                <span className="text-lg">
                                    {t("hero.emoji")}
                                </span>
                            </div>
                            <h1 className="text-title font-extrabold tracking-tight mb-4">
                                {t("hero.title")}
                            </h1>
                            <p className="text-yellow-200/80 leading-relaxed mb-6">
                                {t("hero.description")}
                            </p>
                            <div className="flex gap-3">
                                <Link href="/signup">
                                    <Button>{t("hero.primaryCta")}</Button>
                                </Link>
                                <Link href="#playground">
                                    <Button
                                        variant="outline"
                                        className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                                    >
                                        {t("hero.secondaryCta")}
                                    </Button>
                                </Link>
                            </div>
                            <div className="mt-3 text-xs text-yellow-200/70">
                                {heroSupportValues.map((item, index) => (
                                    <span
                                        key={item}
                                        className={
                                            index < heroSupportValues.length - 1
                                                ? "mr-3"
                                                : ""
                                        }
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg-narrow:block text-right text-7xl">
                            {t("hero.emoji")}✨
                        </div>
                    </div>
                </section>

                <div
                    id="playground"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] pb-12"
                >
                    <Playground />
                </div>

                <section
                    id="features"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        {t("features.title")}
                    </h2>
                    <div className="grid gap-4 xs:grid-cols-2 lg-narrow:grid-cols-3">
                        {features.map((f) => (
                            <Card
                                key={f.title}
                                className="bg-black/40 border-yellow-400/20"
                            >
                                <CardContent className="p-4">
                                    <h3 className="font-semibold mb-1">
                                        {f.title}
                                    </h3>
                                    <p className="text-sm text-yellow-200/80">
                                        {f.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section
                    id="why"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        {t("why.title")}
                    </h2>
                    <div className="grid gap-4 xs:grid-cols-2 lg-narrow:grid-cols-3">
                        {whyItems.map((f) => (
                            <Card
                                key={f.title}
                                className="bg-black/40 border-yellow-400/20"
                            >
                                <CardContent className="p-4">
                                    <h3 className="font-semibold mb-1">
                                        {f.title}
                                    </h3>
                                    <p className="text-sm text-yellow-200/80">
                                        {f.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section
                    id="faq"
                    className="mx-auto w-full max-w-4xl px-[var(--container-px)] py-10"
                >
                    <h2 className="text-subtitle font-bold text-center mb-6">
                        {t("faq.title")}
                    </h2>
                    <div className="space-y-3">
                        {faqItems.map((item) => (
                            <details
                                key={item.question}
                                className="bg-black/40 border border-yellow-400/20 rounded-md p-4"
                            >
                                <summary className="cursor-pointer font-medium text-yellow-50">
                                    {item.question}
                                </summary>
                                <p className="mt-2 text-sm text-yellow-200/80">
                                    {item.answer}
                                </p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
                    <h3 className="text-3xl font-extrabold mb-3">
                        {t("cta.title")}
                    </h3>
                    <p className="text-yellow-200/80 mb-6">
                        {t("cta.description")}
                    </p>
                    <Link href="/signup">
                        <Button className="bg-yellow-400 text-black hover:bg-yellow-300">
                            {t("cta.primaryCta")}
                        </Button>
                    </Link>
                </section>
            </main>

            <PublicFooter />
            <Script id="marketing-structured-data" type="application/ld+json">
                {JSON.stringify(structuredData)}
            </Script>
        </div>
    );
}
