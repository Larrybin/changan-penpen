import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { readCspNonce } from "@/lib/security/csp";
import { buildLocalizedPath } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/seo/jsonld";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { about } = context.messages;
    return createMetadata(context, {
        path: "/about",
        title: about.title,
        description: about.description,
    });
}

export default async function AboutPage() {
    const locale = resolveAppLocale(await getLocale());
    const nonce = readCspNonce(await headers());
    const [t, metadataContext] = await Promise.all([
        getTranslations("StaticPages.about"),
        getMetadataContext(locale),
    ]);
    const sections = t.raw("sections") as Array<{
        title: string;
        description: string;
    }>;
    const canonicalPath = buildLocalizedPath(locale, "/about");
    const absoluteUrl =
        canonicalPath === "/"
            ? metadataContext.appUrl
            : `${metadataContext.appUrl}${canonicalPath}`;
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
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
        mainEntity: sections.map((section) => ({
            "@type": "CreativeWork",
            name: section.title,
            description: section.description,
        })),
    };

    return (
        <div className="mx-auto max-w-3xl space-y-8 px-[var(--container-px)] py-12">
            <header className="space-y-3 text-center">
                <h1 className="font-bold text-title-sm">{t("title")}</h1>
                <p className="text-balance text-muted-foreground">
                    {t("intro")}
                </p>
            </header>
            <div className="space-y-6">
                {sections.map((section) => (
                    <section key={section.title} className="space-y-2">
                        <h2 className="font-semibold text-foreground text-xl">
                            {section.title}
                        </h2>
                        <p className="text-balance text-muted-foreground">
                            {section.description}
                        </p>
                    </section>
                ))}
            </div>
            <Script
                nonce={nonce}
                id="about-structured-data"
                type="application/ld+json"
            >
                {serializeJsonLd(structuredData)}
            </Script>
        </div>
    );
}
