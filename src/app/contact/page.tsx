import type { Metadata } from "next";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { buildLocalizedPath } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { contact } = context.messages;
    return createMetadata(context, {
        path: "/contact",
        title: contact.title,
        description: contact.description,
    });
}

export default async function ContactPage() {
    const locale = (await getLocale()) as AppLocale;
    const [t, metadataContext] = await Promise.all([
        getTranslations("StaticPages.contact"),
        getMetadataContext(locale),
    ]);
    const sections = t.raw("sections") as Array<{
        title: string;
        description: string;
    }>;
    const details = t.raw("details") as Array<{
        label: string;
        value: string;
    }>;
    const canonicalPath = buildLocalizedPath(locale, "/contact");
    const absoluteUrl =
        canonicalPath === "/"
            ? metadataContext.appUrl
            : `${metadataContext.appUrl}${canonicalPath}`;
    const contactPoints = details
        .map((detail) => {
            const point: Record<string, string> = {
                "@type": "ContactPoint",
                contactType: detail.label,
            };
            if (detail.value.includes("@")) {
                point.email = detail.value;
            }
            if (/^[+0-9][0-9\s()+-]*$/.test(detail.value)) {
                point.telephone = detail.value;
            }
            return point;
        })
        .filter((point) => point.email || point.telephone);
    const hoursDetail = details.find((detail) =>
        detail.label.toLowerCase().includes("hour"),
    );
    const structuredData: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
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
    };
    if (contactPoints.length) {
        structuredData.contactPoint = contactPoints;
    }
    if (hoursDetail) {
        structuredData.openingHoursSpecification = [
            {
                "@type": "OpeningHoursSpecification",
                description: hoursDetail.value,
            },
        ];
    }

    return (
        <div className="mx-auto max-w-3xl px-[var(--container-px)] py-12 space-y-8">
            <header className="space-y-3 text-center">
                <h1 className="text-title-sm font-bold">{t("title")}</h1>
                <p className="text-muted-foreground text-balance">
                    {t("intro")}
                </p>
            </header>
            <section className="bg-muted/40 border border-border rounded-lg p-6">
                <ul className="space-y-3 text-sm text-foreground">
                    {details.map((detail) => (
                        <li
                            key={detail.label}
                            className="flex flex-col xs:flex-row xs:items-center xs:justify-between"
                        >
                            <span className="font-medium">{detail.label}</span>
                            <span className="text-muted-foreground xs:text-right">
                                {detail.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
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
            <Script id="contact-structured-data" type="application/ld+json">
                {JSON.stringify(structuredData)}
            </Script>
        </div>
    );
}
