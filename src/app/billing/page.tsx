import PricingGrid from "@/modules/creem/components/pricing-grid";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import {
    CREDITS_TIERS,
    SUBSCRIPTION_TIERS,
} from "@/modules/creem/config/subscriptions";
import type { AppLocale } from "@/i18n/config";
import { buildLocalizedPath, localeCurrencyMap } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { billing } = context.messages;
    return createMetadata(context, {
        path: "/billing",
        title: billing.title,
        description: billing.description,
    });
}

export default async function Page() {
    const locale = (await getLocale()) as AppLocale;
    const [t, metadataContext] = await Promise.all([
        getTranslations("Billing"),
        getMetadataContext(locale),
    ]);
    const canonicalPath = buildLocalizedPath(locale, "/billing");
    const absoluteUrl =
        canonicalPath === "/"
            ? metadataContext.appUrl
            : `${metadataContext.appUrl}${canonicalPath}`;
    const currency = localeCurrencyMap[locale] ?? localeCurrencyMap.en;
    const offers = [...SUBSCRIPTION_TIERS, ...CREDITS_TIERS].map((tier) => {
        const priceValue = tier.priceMonthly?.replace(/[^0-9.,]/g, "");
        const offer: Record<string, unknown> = {
            "@type": "Offer",
            name: tier.name,
            priceCurrency: currency,
            url: `${absoluteUrl}?plan=${encodeURIComponent(tier.id)}`,
            availability: "https://schema.org/InStock",
        };
        if (priceValue) {
            offer.price = priceValue;
        }
        if (tier.description) {
            offer.description = tier.description;
        }
        if (typeof tier.creditAmount === "number") {
            offer.eligibleQuantity = tier.creditAmount;
        }
        return offer;
    });
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: t("title"),
        description: t("description"),
        serviceType: "SoftwareSubscription",
        inLanguage: locale,
        url: absoluteUrl,
        provider: {
            "@type": "Organization",
            name: metadataContext.settings.siteName?.trim().length
                ? metadataContext.settings.siteName.trim()
                : metadataContext.messages.openGraph.siteName,
            url: metadataContext.appUrl,
        },
        offers,
    };
    return (
        <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
            <div className="text-center mb-10">
                <h1 className="text-title-sm font-bold mb-3">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
                <p className="text-muted-foreground mt-2">
                    {t.rich("loginPrompt", {
                        login: (chunks) => (
                            <Link href="/login" className="underline">
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>
            <PricingGrid />
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
