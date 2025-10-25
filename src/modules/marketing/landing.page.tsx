import Link from "next/link";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { SkipLink } from "@/components/accessibility/skip-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAppLocale } from "@/i18n/config";
import { localeCurrencyMap } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/seo/jsonld";
import Playground from "./components/playground-loader";
import PublicFooter from "./components/public-footer";
import PublicHeader from "./components/public-header";

type MarketingLandingPageProps = {
    appUrl: string;
    structuredDataImage: string;
    siteName?: string;
    nonce?: string;
};

export default function MarketingLandingPage({
    appUrl,
    structuredDataImage,
    siteName,
    nonce,
}: MarketingLandingPageProps) {
    const t = useTranslations("Marketing");
    const locale = resolveAppLocale(useLocale());
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
    const trustItems = t.raw("trust.items") as Array<{
        quote: string;
        author: string;
        role: string;
    }>;
    const heroSupport = t.raw("hero.support") as Record<string, string>;
    const heroSupportValues = Object.values(heroSupport);
    const currency = localeCurrencyMap[locale] ?? localeCurrencyMap.en;
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
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: resolvedSiteName,
        url: appUrl,
        logo: structuredDataImage,
        sameAs: t.raw("trust.socialProfiles") as string[] | undefined,
    };
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: resolvedSiteName,
        url: appUrl,
        description: t("structuredData.description"),
        inLanguage: locale,
    };
    const structuredDataPayload = [
        structuredData,
        faqSchema,
        organizationSchema,
        websiteSchema,
    ];
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
            <SkipLink />
            <PublicHeader />

            <main id="main-content" tabIndex={-1}>
                <header className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-12 md:py-16">
                    <div className="grid xs:grid-cols-2 items-center gap-[var(--grid-gap-section)]">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge
                                    className="bg-yellow-400 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                                    aria-label={t("hero.badge")}
                                >
                                    {t("hero.badge")}
                                </Badge>
                                {/* 装饰性emoji，使用aria-hidden */}
                                <span
                                    className="text-lg"
                                    aria-hidden="true"
                                    role="presentation"
                                >
                                    {t("hero.emoji")}
                                </span>
                            </div>
                            <h1
                                id="hero-heading"
                                className="mb-4 font-extrabold text-title tracking-tight"
                            >
                                {t("hero.title")}
                            </h1>
                            <p className="mb-6 text-lg text-yellow-200/80 leading-relaxed">
                                {t("hero.description")}
                            </p>
                            <nav
                                aria-label={t("hero.primaryActions")}
                                className="mb-6 flex xs:flex-row flex-col gap-3 xs:gap-3"
                            >
                                <Link
                                    href="/signup"
                                    className="inline-flex"
                                    aria-label={t("hero.primaryAriaLabel")}
                                >
                                    <Button
                                        className="w-full xs:w-auto focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                                        size="lg"
                                    >
                                        {t("hero.primaryCta")}
                                    </Button>
                                </Link>
                                <Link
                                    href="#playground"
                                    className="inline-flex"
                                    aria-label={t("hero.secondaryAriaLabel")}
                                >
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full xs:w-auto border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-black"
                                    >
                                        {t("hero.secondaryCta")}
                                    </Button>
                                </Link>
                            </nav>
                            <ul
                                aria-label={t("hero.featuresLabel")}
                                className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-yellow-200/70"
                            >
                                {heroSupportValues.map((item) => (
                                    <li
                                        className="inline-flex items-center gap-1"
                                        key={item}
                                    >
                                        <span className="sr-only">
                                            {t("hero.featurePrefix")}
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* 装饰性emoji区域，添加固定高度防止CLS */}
                        <div
                            className="hidden min-h-[4rem] animate-pulse text-right text-7xl lg-narrow:block"
                            aria-hidden="true"
                            role="presentation"
                        >
                            {t("hero.emoji")}✨
                        </div>
                    </div>
                </header>

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
                        <Playground />
                    </main>
                </section>

                <section
                    id="features"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="mb-6 text-center font-bold text-subtitle">
                        {t("features.title")}
                    </h2>
                    <div className="grid xs:grid-cols-2 gap-4 lg-narrow:grid-cols-3">
                        {features.map((f) => (
                            <Card
                                key={f.title}
                                className="border-yellow-400/20 bg-black/40"
                            >
                                <CardContent className="p-4">
                                    <h3 className="mb-1 font-semibold">
                                        {f.title}
                                    </h3>
                                    <p className="text-sm text-yellow-200/80">
                                        {f.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <p className="mt-6 text-sm text-yellow-100/80">
                        {t.rich("features.learnMore", {
                            billingLink: (chunks) => (
                                <Link
                                    href="/billing"
                                    className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                </section>

                <section
                    id="why"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="mb-6 text-center font-bold text-subtitle">
                        {t("why.title")}
                    </h2>
                    <div className="grid xs:grid-cols-2 gap-4 lg-narrow:grid-cols-3">
                        {whyItems.map((f) => (
                            <Card
                                key={f.title}
                                className="border-yellow-400/20 bg-black/40"
                            >
                                <CardContent className="p-4">
                                    <h3 className="mb-1 font-semibold">
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
                    <h2 className="mb-6 text-center font-bold text-subtitle">
                        {t("faq.title")}
                    </h2>
                    <div className="space-y-3">
                        {faqItems.map((item) => (
                            <details
                                key={item.question}
                                className="rounded-md border border-yellow-400/20 bg-black/40 p-4"
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
                    <p className="mt-6 text-sm text-yellow-100/80">
                        {t.rich("faq.supportingCopy", {
                            contactLink: (chunks) => (
                                <Link
                                    href="/contact"
                                    className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                                >
                                    {chunks}
                                </Link>
                            ),
                            aboutLink: (chunks) => (
                                <Link
                                    href="/about"
                                    className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                </section>

                <section
                    id="trust"
                    className="mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-10"
                >
                    <h2 className="mb-4 text-center font-bold text-subtitle">
                        {t("trust.title")}
                    </h2>
                    <p className="mx-auto mb-8 max-w-2xl text-center text-yellow-200/80">
                        {t("trust.description")}
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                        {trustItems.map((item) => (
                            <Card
                                key={`${item.author}-${item.role}`}
                                className="h-full border-yellow-400/20 bg-black/40"
                            >
                                <CardContent className="flex flex-col gap-3 p-5">
                                    <p className="text-sm text-yellow-50 leading-relaxed">
                                        “{item.quote}”
                                    </p>
                                    <div className="text-xs text-yellow-200/70">
                                        <p className="font-semibold">
                                            {item.author}
                                        </p>
                                        <p>{item.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <p className="mt-8 text-center text-sm text-yellow-100/80">
                        {t.rich("trust.callout", {
                            privacyLink: (chunks) => (
                                <Link
                                    href="/privacy"
                                    className="underline decoration-yellow-300 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-2"
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                </section>

                <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center">
                    <h3 className="mb-3 font-extrabold text-3xl">
                        {t("cta.title")}
                    </h3>
                    <p className="mb-6 text-yellow-200/80">
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
            <Script
                id="marketing-structured-data"
                type="application/ld+json"
                nonce={nonce}
            >
                {serializeJsonLd(structuredDataPayload)}
            </Script>
        </div>
    );
}
