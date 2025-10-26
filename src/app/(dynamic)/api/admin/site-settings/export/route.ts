import { type NextRequest, NextResponse } from "next/server";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import {
    buildLocalizedPath,
    ensureAbsoluteUrl,
    localeCurrencyMap,
    resolveAppUrl,
} from "@/lib/seo";
import type { StaticSiteConfig } from "@/lib/static-config";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const AUTH_HEADER = "authorization";

function readBearerToken(request: NextRequest): string | null {
    const header = request.headers.get(AUTH_HEADER);
    if (header) {
        const [scheme, value] = header.split(" ");
        if (scheme?.toLowerCase() === "bearer" && value?.trim().length) {
            return value.trim();
        }
    }
    const queryToken = request.nextUrl.searchParams.get("token");
    if (queryToken?.trim().length) {
        return queryToken.trim();
    }
    return null;
}

function buildPageUrl(appUrl: string, locale: AppLocale, path: string) {
    const localizedPath = buildLocalizedPath(locale, path);
    if (localizedPath === "/") {
        return appUrl;
    }
    return `${appUrl}${localizedPath}`;
}

function readStaticExportSecret(): string {
    const token = process.env.STATIC_EXPORT_TOKEN;
    if (!token?.trim().length) {
        throw new Error("STATIC_EXPORT_TOKEN is not configured");
    }
    return token.trim();
}

type MarketingMessages = Record<string, unknown>;

type StaticPageMessages = Record<string, unknown>;

type MetadataMessages = {
    openGraph: { siteName: string };
};

type MessagesModule = {
    Marketing: MarketingMessages;
    StaticPages: StaticPageMessages;
    Metadata: MetadataMessages;
};

function getSiteName(
    settings: Awaited<ReturnType<typeof getSiteSettingsPayload>>,
    metadataMessages: MetadataMessages,
): string {
    const siteName = settings.siteName?.trim();
    if (siteName?.length) {
        return siteName;
    }
    return metadataMessages?.openGraph?.siteName ?? "";
}

function resolveOgImage(
    locale: AppLocale,
    appUrl: string,
    settings: Awaited<ReturnType<typeof getSiteSettingsPayload>>,
): string {
    const localized = settings.seoOgImageLocalized?.[locale]?.trim();
    const base = settings.seoOgImage?.trim();
    const source = localized?.length
        ? localized
        : base?.length
          ? base
          : "/og-image.svg";
    return ensureAbsoluteUrl(source, appUrl);
}

function toSections(
    value: unknown,
): Array<{ title: string; description: string }> {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.flatMap((item) => {
        if (
            item &&
            typeof item === "object" &&
            typeof (item as { title?: unknown }).title === "string" &&
            typeof (item as { description?: unknown }).description === "string"
        ) {
            return [
                {
                    title: (item as { title: string }).title,
                    description: (item as { description: string }).description,
                },
            ];
        }
        return [];
    });
}

function createAboutStructuredData(
    locale: AppLocale,
    appUrl: string,
    siteName: string,
    messages: StaticPageMessages,
) {
    const page = (messages.about ?? {}) as Record<string, unknown>;
    const sections = toSections(page.sections);
    return {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: (page.title as string) ?? siteName,
        description: (page.intro as string) ?? "",
        inLanguage: locale,
        url: buildPageUrl(appUrl, locale, "/about"),
        isPartOf: {
            "@type": "WebSite",
            name: siteName,
            url: appUrl,
        },
        mainEntity: sections.map((section) => ({
            "@type": "CreativeWork",
            name: section.title,
            description: section.description,
        })),
    } satisfies Record<string, unknown>;
}

function createContactStructuredData(
    locale: AppLocale,
    appUrl: string,
    siteName: string,
    messages: StaticPageMessages,
) {
    const page = (messages.contact ?? {}) as Record<string, unknown>;
    const details = Array.isArray(page.details)
        ? (page.details as Array<Record<string, unknown>>)
        : [];
    const contactPoints = details
        .map((detail) => {
            const label = detail.label;
            const value = detail.value;
            if (typeof label !== "string" || typeof value !== "string") {
                return null;
            }
            const trimmedValue = value.trim();
            if (!trimmedValue.length) {
                return null;
            }
            const contactPoint: Record<string, string> = {
                "@type": "ContactPoint",
                contactType: label,
            };
            if (trimmedValue.includes("@")) {
                contactPoint.email = trimmedValue;
            }
            if (/^[+0-9][0-9\s()+-]*$/.test(trimmedValue)) {
                contactPoint.telephone = trimmedValue;
            }
            return contactPoint;
        })
        .filter((value): value is Record<string, string> => Boolean(value));

    const hoursDetail = details.find((detail) => {
        const label = detail.label;
        if (typeof label !== "string") {
            return false;
        }
        return label.toLowerCase().includes("hour");
    });

    return {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: (page.title as string) ?? siteName,
        description: (page.intro as string) ?? "",
        inLanguage: locale,
        url: buildPageUrl(appUrl, locale, "/contact"),
        isPartOf: {
            "@type": "WebSite",
            name: siteName,
            url: appUrl,
        },
        ...(contactPoints.length ? { contactPoint: contactPoints } : {}),
        ...(hoursDetail && typeof hoursDetail.value === "string"
            ? {
                  openingHoursSpecification: [
                      {
                          "@type": "OpeningHoursSpecification",
                          description: hoursDetail.value,
                      },
                  ],
              }
            : {}),
    } satisfies Record<string, unknown>;
}

function createPolicyStructuredData(
    locale: AppLocale,
    appUrl: string,
    siteName: string,
    messages: StaticPageMessages,
    key: "privacy" | "terms",
) {
    const page = (messages[key] ?? {}) as Record<string, unknown>;
    const sections = toSections(page.sections);
    const type = key === "privacy" ? "PrivacyPolicy" : "TermsOfService";
    const path = key === "privacy" ? "/privacy" : "/terms";
    return {
        "@context": "https://schema.org",
        "@type": type,
        name: (page.title as string) ?? siteName,
        description: (page.intro as string) ?? "",
        inLanguage: locale,
        url: buildPageUrl(appUrl, locale, path),
        isPartOf: {
            "@type": "WebSite",
            name: siteName,
            url: appUrl,
        },
        hasPart: sections.map((section) => ({
            "@type": "WebPageSection",
            name: section.title,
            description: section.description,
        })),
    } satisfies Record<string, unknown>;
}

function createMarketingStructuredData(
    locale: AppLocale,
    appUrl: string,
    siteName: string,
    structuredDataImage: string,
    messages: MarketingMessages,
) {
    const marketing = messages ?? {};
    const hero = (marketing.hero ?? {}) as Record<string, unknown>;
    const structured = (marketing.structuredData ?? {}) as Record<
        string,
        unknown
    >;
    const faq = (marketing.faq ?? {}) as Record<string, unknown>;
    const trust = (marketing.trust ?? {}) as Record<string, unknown>;
    const faqItems = Array.isArray(faq.items)
        ? (faq.items as Array<Record<string, unknown>>)
        : [];
    const featureList = Array.isArray(structured.featureList)
        ? (structured.featureList as string[])
        : [];
    const socialProfiles = Array.isArray(trust.socialProfiles)
        ? (trust.socialProfiles as string[])
        : undefined;
    const currency = localeCurrencyMap[locale] ?? localeCurrencyMap.en;

    return [
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: (structured.name as string) ?? siteName,
            url: appUrl,
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            description: (structured.description as string) ?? "",
            featureList,
            image: structuredDataImage,
            offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: currency,
            },
            inLanguage: locale,
            alternateName: (hero.title as string) ?? siteName,
            slogan:
                (structured.tagline as string) ??
                (hero.title as string) ??
                siteName,
            publisher: {
                "@type": "Organization",
                name: siteName,
                url: appUrl,
                logo: {
                    "@type": "ImageObject",
                    url: structuredDataImage,
                },
            },
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: (item.question as string) ?? "",
                acceptedAnswer: {
                    "@type": "Answer",
                    text: (item.answer as string) ?? "",
                },
            })),
        },
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: appUrl,
            logo: structuredDataImage,
            ...(socialProfiles?.length ? { sameAs: socialProfiles } : {}),
        },
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteName,
            url: appUrl,
            description: (structured.description as string) ?? "",
            inLanguage: locale,
        },
    ] satisfies Record<string, unknown>[];
}

async function buildConfigForLocale(
    locale: AppLocale,
    appUrl: string,
    settings: Awaited<ReturnType<typeof getSiteSettingsPayload>>,
): Promise<StaticSiteConfig> {
    const messagesModule = (await import(
        `@/i18n/messages/${locale}.json`
    )) as MessagesModule;
    const metadataMessages = messagesModule.Metadata;
    const siteName = getSiteName(settings, metadataMessages);
    const ogImage = resolveOgImage(locale, appUrl, settings);
    const structuredData = {
        marketing: createMarketingStructuredData(
            locale,
            appUrl,
            siteName,
            ogImage,
            messagesModule.Marketing,
        ),
        about: createAboutStructuredData(
            locale,
            appUrl,
            siteName,
            messagesModule.StaticPages,
        ),
        contact: createContactStructuredData(
            locale,
            appUrl,
            siteName,
            messagesModule.StaticPages,
        ),
        privacy: createPolicyStructuredData(
            locale,
            appUrl,
            siteName,
            messagesModule.StaticPages,
            "privacy",
        ),
        terms: createPolicyStructuredData(
            locale,
            appUrl,
            siteName,
            messagesModule.StaticPages,
            "terms",
        ),
    } satisfies Record<string, unknown>;

    return {
        locale,
        metadata: {
            baseUrl: appUrl,
            siteName,
            ogImage,
            structuredData,
        },
        messages: {
            Marketing: messagesModule.Marketing,
            StaticPages: messagesModule.StaticPages,
        },
    } satisfies StaticSiteConfig;
}

export async function GET(request: NextRequest) {
    let secret: string;
    try {
        secret = readStaticExportSecret();
    } catch (error) {
        console.error("Static export token is missing", error);
        return NextResponse.json(
            { error: "Static export token is not configured" },
            { status: 500 },
        );
    }

    const providedToken = readBearerToken(request);
    if (!providedToken || providedToken !== secret) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await getSiteSettingsPayload();
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appUrl = resolveAppUrl(settings, { envAppUrl });

    const configs: Record<AppLocale, StaticSiteConfig> = {} as Record<
        AppLocale,
        StaticSiteConfig
    >;

    for (const locale of supportedLocales) {
        configs[locale] = await buildConfigForLocale(locale, appUrl, settings);
    }

    return NextResponse.json(configs);
}
