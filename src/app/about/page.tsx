import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { buildLocalizedPath } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { about } = context.messages;
    return createMetadata(context, {
        path: "/about",
        title: about.title,
        description: about.description,
    });
}

export default async function AboutPage() {
    const locale = (await getLocale()) as AppLocale;
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
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData),
                }}
            />
        </div>
    );
}
