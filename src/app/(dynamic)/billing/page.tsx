import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import Script from "next/script";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { readCspNonce } from "@/lib/security/csp";
import { buildLocalizedPath, localeCurrencyMap } from "@/lib/seo";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import CreditsSection from "@/modules/billing/components/credits-section";
import PricingGrid from "@/modules/creem/components/pricing-grid";
import {
    CREDITS_TIERS,
    SUBSCRIPTION_TIERS,
} from "@/modules/creem/config/subscriptions";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { billing } = context.messages;
    return createMetadata(context, {
        path: "/billing",
        title: billing.title,
        description: billing.description,
    });
}

export default async function Page() {
    const locale = resolveAppLocale(await getLocale());
    const nonce = readCspNonce(await headers());
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
        <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-12">
            <div className="mb-10 text-center">
                <h1 className="mb-3 font-bold text-title-sm">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
                <p className="mt-2 text-muted-foreground">
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
            <div className="mt-12">
                <CreditsSection />
            </div>
            <Script
                nonce={nonce}
                id="billing-structured-data"
                type="application/ld+json"
            >
                {JSON.stringify(structuredData)}
            </Script>
        </div>
    );
}
