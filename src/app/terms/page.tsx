import type { Metadata } from "next";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { buildLocalizedPath } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { terms } = context.messages;
    return createMetadata(context, {
        path: "/terms",
        title: terms.title,
        description: terms.description,
    });
}

export default async function TermsPage() {
    const locale = (await getLocale()) as AppLocale;
    const [t, metadataContext] = await Promise.all([
        getTranslations("StaticPages.terms"),
        getMetadataContext(locale),
    ]);
    const sections = t.raw("sections") as Array<{
        title: string;
        description: string;
    }>;
    const canonicalPath = buildLocalizedPath(locale, "/terms");
    const absoluteUrl =
        canonicalPath === "/"
            ? metadataContext.appUrl
            : `${metadataContext.appUrl}${canonicalPath}`;
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "TermsOfService",
        name: t("title"),
        description: t("intro"),
        inLanguage: locale,
        url: absoluteUrl,
        isPartOf: {
            "@type": "WebSite",
            name: metadataContext.settings.siteName?.trim().length
                ? metadataContext.settings.siteName.trim()
                : metadataContext.messages.openGraph.siteName,
            url: metadataContext.appUrl,
        },
        hasPart: sections.map((section) => ({
            "@type": "WebPageSection",
            name: section.title,
            description: section.description,
        })),
    };

    return (
        <div className="mx-auto max-w-3xl px-[var(--container-px)] py-12 space-y-8">
            <header className="space-y-3 text-center">
                <h1 className="text-title-sm font-bold">{t("title")}</h1>
                <p className="text-muted-foreground text-balance">
                    {t("intro")}
                </p>
            </header>
            <div className="space-y-6">
                {sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                        <h2 className="text-xl font-semibold text-foreground">
                            {section.title}
                        </h2>
                        <p className="text-muted-foreground text-balance">
                            {section.description}
                        </p>
                    </section>
                ))}
            </div>
            <Script id="terms-structured-data" type="application/ld+json">
                {JSON.stringify(structuredData)}
            </Script>
        </div>
    );
}
