import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { readCspNonce } from "@/lib/security/csp";
import { buildLocalizedPath } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { contact } = context.messages;
    return createMetadata(context, {
        path: "/contact",
        title: contact.title,
        description: contact.description,
    });
}

export default async function ContactPage() {
    const locale = resolveAppLocale(await getLocale());
    const nonce = readCspNonce(await headers());
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
        <div className="mx-auto max-w-3xl space-y-8 px-[var(--container-px)] py-12">
            <header className="space-y-3 text-center">
                <h1 className="font-bold text-title-sm">{t("title")}</h1>
                <p className="text-balance text-muted-foreground">
                    {t("intro")}
                </p>
            </header>
            <section className="rounded-lg border border-border bg-muted/40 p-6">
                <ul className="space-y-3 text-foreground text-sm">
                    {details.map((detail) => (
                        <li
                            key={detail.label}
                            className="flex xs:flex-row flex-col xs:items-center xs:justify-between"
                        >
                            <span className="font-medium">{detail.label}</span>
                            <span className="xs:text-right text-muted-foreground">
                                {detail.value}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
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
                id="contact-structured-data"
                type="application/ld+json"
            >
                {JSON.stringify(structuredData)}
            </Script>
        </div>
    );
}
