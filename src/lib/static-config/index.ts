import { desc, eq } from "drizzle-orm";
import { unstable_cacheLife, unstable_cacheTag } from "next/cache";

import { getDb, marketingContentVersions } from "@/db";
import { type AppLocale, supportedLocales } from "@/i18n/config";
import deMessages from "@/i18n/messages/de.json";
import enMessages from "@/i18n/messages/en.json";
import frMessages from "@/i18n/messages/fr.json";
import ptMessages from "@/i18n/messages/pt.json";
import {
    buildLocalizedPath,
    ensureAbsoluteUrl,
    localeCurrencyMap,
} from "@/lib/seo";
import { marketingSectionFileSchema } from "@/modules/admin/schemas/marketing-content.schema";
import { CACHE_TAGS } from "../cache/cache-tags";

export const MARKETING_SECTIONS = [
    "hero",
    "features",
    "faq",
    "trust",
    "cta",
] as const;

export type MarketingSection = (typeof MARKETING_SECTIONS)[number];

export type MarketingSectionSummary = {
    defaultVariant: string;
    structuredData?: Record<string, unknown> | Array<unknown>;
};

export type MarketingSectionFile = {
    defaultVariant: string;
    variants: Record<string, unknown>;
};

export type StaticSiteConfig = {
    locale: AppLocale;
    metadata: {
        baseUrl: string;
        siteName: string;
        ogImage: string;
        structuredData: Record<string, unknown> | Array<unknown>;
        version: string;
        updatedAt: string;
    };
    messages: {
        Marketing: Record<string, unknown>;
        StaticPages: Record<string, unknown>;
        Common: Record<string, unknown>;
    };
    marketing: {
        sections: Record<MarketingSection, MarketingSectionSummary>;
        variants: Record<MarketingSection, string[]>;
    };
};

type StaticConfigBundle = {
    config: StaticSiteConfig;
    sections: Record<MarketingSection, MarketingSectionFile>;
};

type LocaleMessages = Record<string, unknown>;

type MessagesModule = {
    Marketing: Record<string, unknown>;
    StaticPages: Record<string, unknown>;
    Common: Record<string, unknown>;
    Metadata: {
        openGraph?: {
            siteName?: string;
        };
    };
};

const FALLBACK_MESSAGES: Record<AppLocale, LocaleMessages> = {
    de: deMessages,
    en: enMessages,
    fr: frMessages,
    pt: ptMessages,
};

export type StaticConfigFallbackOptions = {
    baseUrl?: string;
    version?: string;
    updatedAt?: string;
};

const configCache = new Map<AppLocale, StaticSiteConfig>();
const marketingCache = new Map<string, MarketingSectionFile>();
const bundleCache = new Map<AppLocale, StaticConfigBundle>();
const bundlePromises = new Map<AppLocale, Promise<StaticConfigBundle>>();
const fallbackCache = new Map<AppLocale, StaticConfigBundle>();

type DbClient = Awaited<ReturnType<typeof getDb>>;

function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

function cloneBundle(bundle: StaticConfigBundle): StaticConfigBundle {
    return {
        config: cloneJson(bundle.config),
        sections: cloneJson(bundle.sections),
    };
}

function assertLocale(locale: AppLocale): AppLocale {
    if (!supportedLocales.includes(locale)) {
        throw new Error(`Unsupported locale: ${locale}`);
    }
    return locale;
}

function toMarketingSection(value: string): MarketingSection {
    if ((MARKETING_SECTIONS as readonly string[]).includes(value)) {
        return value as MarketingSection;
    }
    throw new Error(`Unsupported marketing section: ${value}`);
}

function getSectionCacheKey(locale: AppLocale, section: MarketingSection) {
    return `${locale}:${section}`;
}

function buildPageUrl(appUrl: string, locale: AppLocale, pathValue: string) {
    const localizedPath = buildLocalizedPath(locale, pathValue);
    if (localizedPath === "/") {
        return appUrl;
    }
    return `${appUrl}${localizedPath}`;
}

type SectionEntry = {
    title: string;
    description: string;
};

function toSections(value: unknown): SectionEntry[] {
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

type StructuredDataParams = {
    locale: AppLocale;
    appUrl: string;
    siteName: string;
    structuredDataImage: string;
    marketingMessages: Record<string, unknown>;
};

function createMarketingStructuredData({
    locale,
    appUrl,
    siteName,
    structuredDataImage,
    marketingMessages,
}: StructuredDataParams) {
    const marketing = marketingMessages ?? {};
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

function createAboutStructuredData(
    locale: AppLocale,
    appUrl: string,
    siteName: string,
    messages: Record<string, unknown>,
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
    messages: Record<string, unknown>,
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
    messages: Record<string, unknown>,
    key: "privacy" | "terms",
) {
    const page = (messages[key] ?? {}) as Record<string, unknown>;
    const sections = toSections(page.sections);
    const type = key === "privacy" ? "PrivacyPolicy" : "TermsOfService";
    const policyPath = key === "privacy" ? "/privacy" : "/terms";
    return {
        "@context": "https://schema.org",
        "@type": type,
        name: (page.title as string) ?? siteName,
        description: (page.intro as string) ?? "",
        inLanguage: locale,
        url: buildPageUrl(appUrl, locale, policyPath),
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

function normalizeVariantKey(value: unknown, fallback: string) {
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return fallback;
}

type MarketingSectionBuildResult = {
    summary: MarketingSectionSummary;
    file: MarketingSectionFile;
};

type BuildOptions = {
    baseUrl: string;
    version: string;
    updatedAt: string;
    siteName?: string;
    ogImage?: string;
};

function buildMarketingSections(
    _locale: AppLocale,
    marketingMessages: Record<string, unknown>,
    structuredData: Record<string, unknown>[],
): Record<MarketingSection, MarketingSectionBuildResult> {
    const hero = (marketingMessages.hero ?? {}) as Record<string, unknown>;
    const heroVariant = normalizeVariantKey(hero.variant, "default");
    const heroVariants: Record<string, unknown> = {
        [heroVariant]: hero,
    };

    const features = (marketingMessages.features ?? {}) as Record<
        string,
        unknown
    >;
    const featuresVariant = normalizeVariantKey(features.variant, "default");
    const featuresVariants: Record<string, unknown> = {
        [featuresVariant]: features,
    };

    const faq = (marketingMessages.faq ?? {}) as Record<string, unknown>;
    const faqVariant = normalizeVariantKey(faq.variant, "default");
    const faqVariants: Record<string, unknown> = {
        [faqVariant]: faq,
    };

    const trust = (marketingMessages.trust ?? {}) as Record<string, unknown>;
    const trustVariant = normalizeVariantKey(trust.variant, "default");
    const trustVariants: Record<string, unknown> = {
        [trustVariant]: trust,
    };

    const cta = (marketingMessages.cta ?? {}) as Record<string, unknown>;
    const ctaVariant = normalizeVariantKey(cta.variant, "default");
    const ctaVariants: Record<string, unknown> = {
        [ctaVariant]: cta,
    };

    const structuredHero = structuredData.length ? structuredData : undefined;
    const structuredFaq =
        structuredData.length > 1 ? structuredData[1] : undefined;
    const structuredTrust =
        structuredData.length > 2 ? structuredData[2] : undefined;
    const structuredWebsite =
        structuredData.length > 3 ? structuredData[3] : undefined;

    const entries: Array<[MarketingSection, MarketingSectionBuildResult]> = [
        [
            "hero",
            {
                summary: {
                    defaultVariant: heroVariant,
                    structuredData: structuredHero,
                },
                file: {
                    defaultVariant: heroVariant,
                    variants: heroVariants,
                },
            },
        ],
        [
            "features",
            {
                summary: {
                    defaultVariant: featuresVariant,
                },
                file: {
                    defaultVariant: featuresVariant,
                    variants: featuresVariants,
                },
            },
        ],
        [
            "faq",
            {
                summary: {
                    defaultVariant: faqVariant,
                    structuredData: structuredFaq,
                },
                file: {
                    defaultVariant: faqVariant,
                    variants: faqVariants,
                },
            },
        ],
        [
            "trust",
            {
                summary: {
                    defaultVariant: trustVariant,
                    structuredData: structuredTrust,
                },
                file: {
                    defaultVariant: trustVariant,
                    variants: trustVariants,
                },
            },
        ],
        [
            "cta",
            {
                summary: {
                    defaultVariant: ctaVariant,
                    structuredData: structuredWebsite,
                },
                file: {
                    defaultVariant: ctaVariant,
                    variants: ctaVariants,
                },
            },
        ],
    ];

    return Object.fromEntries(entries) as Record<
        MarketingSection,
        MarketingSectionBuildResult
    >;
}

export function createStaticConfigBundleFromMessages(
    locale: AppLocale,
    messages: MessagesModule,
    options: BuildOptions,
): StaticConfigBundle {
    const metadataMessages = messages.Metadata ?? {};
    const openGraph = (metadataMessages.openGraph ?? {}) as Record<
        string,
        unknown
    >;
    const marketingMessages = messages.Marketing ?? {};
    const staticPageMessages = messages.StaticPages ?? {};
    const commonMessages = messages.Common ?? {};

    const siteNameOverride = options.siteName?.trim();
    const siteName = siteNameOverride?.length
        ? siteNameOverride
        : typeof openGraph.siteName === "string" &&
            openGraph.siteName.trim().length
          ? openGraph.siteName.trim()
          : "Banana Generator";
    const ogImageSource = options.ogImage?.trim();
    const ogImage = ogImageSource?.length
        ? ensureAbsoluteUrl(ogImageSource, options.baseUrl)
        : ensureAbsoluteUrl("/og-image.svg", options.baseUrl);

    const marketingStructuredData = createMarketingStructuredData({
        locale,
        appUrl: options.baseUrl,
        siteName,
        structuredDataImage: ogImage,
        marketingMessages,
    });

    const structuredData = {
        marketing: marketingStructuredData,
        about: createAboutStructuredData(
            locale,
            options.baseUrl,
            siteName,
            staticPageMessages,
        ),
        contact: createContactStructuredData(
            locale,
            options.baseUrl,
            siteName,
            staticPageMessages,
        ),
        privacy: createPolicyStructuredData(
            locale,
            options.baseUrl,
            siteName,
            staticPageMessages,
            "privacy",
        ),
        terms: createPolicyStructuredData(
            locale,
            options.baseUrl,
            siteName,
            staticPageMessages,
            "terms",
        ),
    } satisfies Record<string, unknown>;

    const marketingSections = buildMarketingSections(
        locale,
        marketingMessages,
        marketingStructuredData,
    );

    const sectionsSummary = Object.fromEntries(
        Object.entries(marketingSections).map(([section, value]) => [
            toMarketingSection(section),
            value.summary,
        ]),
    ) as Record<MarketingSection, MarketingSectionSummary>;

    const sectionsFiles = Object.fromEntries(
        Object.entries(marketingSections).map(([section, value]) => [
            toMarketingSection(section),
            value.file,
        ]),
    ) as Record<MarketingSection, MarketingSectionFile>;

    const variants = Object.fromEntries(
        Object.entries(sectionsFiles).map(([section, file]) => [
            toMarketingSection(section),
            Object.keys(file.variants),
        ]),
    ) as Record<MarketingSection, string[]>;

    return {
        config: {
            locale,
            metadata: {
                baseUrl: options.baseUrl,
                siteName,
                ogImage,
                structuredData,
                version: options.version,
                updatedAt: options.updatedAt,
            },
            messages: {
                Marketing: marketingMessages,
                StaticPages: staticPageMessages,
                Common: commonMessages,
            },
            marketing: {
                sections: sectionsSummary,
                variants,
            },
        },
        sections: sectionsFiles,
    } satisfies StaticConfigBundle;
}

function buildFallbackBundle(
    locale: AppLocale,
    options: StaticConfigFallbackOptions = {},
): StaticConfigBundle {
    const cached = fallbackCache.get(locale);
    if (cached) {
        return cached;
    }
    const messages = FALLBACK_MESSAGES[locale] as MessagesModule;
    const version = options.version?.trim().length
        ? options.version.trim()
        : "local";
    const updatedAt = options.updatedAt?.trim().length
        ? options.updatedAt.trim()
        : new Date().toISOString();
    const baseUrl = options.baseUrl ?? "http://localhost:3000";
    const bundle = createStaticConfigBundleFromMessages(locale, messages, {
        baseUrl,
        version,
        updatedAt,
    });
    fallbackCache.set(locale, bundle);
    return bundle;
}

function cacheBundle(locale: AppLocale, bundle: StaticConfigBundle) {
    const snapshot = cloneBundle(bundle);
    bundleCache.set(locale, snapshot);
    configCache.set(locale, snapshot.config);
    for (const [section, file] of Object.entries(snapshot.sections)) {
        const key = getSectionCacheKey(locale, toMarketingSection(section));
        marketingCache.set(key, file);
    }
}

export function createFallbackConfig(
    locale: AppLocale,
    options: StaticConfigFallbackOptions = {},
): StaticSiteConfig {
    const normalized = assertLocale(locale);
    const bundle = buildFallbackBundle(normalized, options);
    cacheBundle(normalized, bundle);
    return bundle.config;
}

function createFallbackSection(
    locale: AppLocale,
    section: MarketingSection,
    options: StaticConfigFallbackOptions = {},
) {
    const normalized = assertLocale(locale);
    const bundle = buildFallbackBundle(normalized, options);
    cacheBundle(normalized, bundle);
    return bundle.sections[section];
}

export function createFallbackMarketingSection(
    locale: AppLocale,
    section: MarketingSection,
    options: StaticConfigFallbackOptions = {},
): MarketingSectionFile {
    return createFallbackSection(locale, section, options);
}

function parseSectionPayload(raw: string): MarketingSectionFile | null {
    try {
        const parsed = JSON.parse(raw) as unknown;
        return marketingSectionFileSchema.parse(parsed);
    } catch {
        return null;
    }
}

async function tryGetDb(): Promise<DbClient | null> {
    try {
        return await getDb();
    } catch {
        return null;
    }
}

async function fetchMarketingContentRows(db: DbClient, locale: AppLocale) {
    return db
        .select({
            section: marketingContentVersions.section,
            payload: marketingContentVersions.payload,
            version: marketingContentVersions.version,
            metadataVersion: marketingContentVersions.metadataVersion,
            createdAt: marketingContentVersions.createdAt,
        })
        .from(marketingContentVersions)
        .where(eq(marketingContentVersions.locale, locale))
        .orderBy(desc(marketingContentVersions.version));
}

type MarketingContentRow = Awaited<
    ReturnType<typeof fetchMarketingContentRows>
>[number];

type ParsedMarketingContentRow = {
    section: MarketingSection;
    payload: MarketingSectionFile;
};

type LatestMetadataState = {
    publishedAt: string;
    metadataVersion: string;
};

function parseMarketingContentRow(
    row: MarketingContentRow,
): ParsedMarketingContentRow | null {
    let section: MarketingSection;
    try {
        section = toMarketingSection(row.section);
    } catch {
        return null;
    }

    const payload = parseSectionPayload(row.payload);
    if (!payload) {
        return null;
    }

    return { section, payload };
}

function updateBundleWithRow(
    bundle: StaticConfigBundle,
    parsed: ParsedMarketingContentRow,
) {
    const { section, payload } = parsed;
    bundle.sections[section] = payload;
    bundle.config.marketing.sections[section] = {
        ...(bundle.config.marketing.sections[section] ?? {}),
        defaultVariant: payload.defaultVariant,
    };
    bundle.config.marketing.variants[section] = Object.keys(payload.variants);
}

function updateLatestMetadataState(
    state: LatestMetadataState,
    locale: AppLocale,
    section: MarketingSection,
    row: MarketingContentRow,
): LatestMetadataState {
    const publishedAt = row.createdAt ?? "";
    if (!publishedAt || publishedAt <= state.publishedAt) {
        return state;
    }

    return {
        publishedAt,
        metadataVersion:
            row.metadataVersion ??
            computeMarketingMetadataVersion(locale, section, row.version),
    };
}

function applyRowsToBundle(
    bundle: StaticConfigBundle,
    locale: AppLocale,
    rows: MarketingContentRow[],
): StaticConfigBundle {
    const seenSections = new Set<MarketingSection>();
    let metadataState: LatestMetadataState = {
        publishedAt: bundle.config.metadata.updatedAt ?? "",
        metadataVersion: bundle.config.metadata.version ?? "",
    };

    for (const row of rows) {
        const parsed = parseMarketingContentRow(row);
        if (!parsed || seenSections.has(parsed.section)) {
            continue;
        }

        updateBundleWithRow(bundle, parsed);
        seenSections.add(parsed.section);
        metadataState = updateLatestMetadataState(
            metadataState,
            locale,
            parsed.section,
            row,
        );
    }

    if (metadataState.publishedAt) {
        bundle.config.metadata.updatedAt = metadataState.publishedAt;
    }
    if (metadataState.metadataVersion) {
        bundle.config.metadata.version = metadataState.metadataVersion;
    }

    return bundle;
}

export function computeMarketingMetadataVersion(
    locale: AppLocale,
    section: MarketingSection,
    version: number,
) {
    return `marketing:${locale}:${section}:v${version}`;
}

async function loadBundleFromStore(
    locale: AppLocale,
): Promise<StaticConfigBundle> {
    const fallback = buildFallbackBundle(locale);
    const db = await tryGetDb();
    if (!db) {
        return fallback;
    }

    const rows = await fetchMarketingContentRows(db, locale);
    if (!rows.length) {
        return fallback;
    }

    return applyRowsToBundle(fallback, locale, rows);
}

async function ensureBundleLoaded(
    locale: AppLocale,
): Promise<StaticConfigBundle> {
    const cached = bundleCache.get(locale);
    if (cached) {
        return cloneBundle(cached);
    }

    let inflight = bundlePromises.get(locale);
    if (!inflight) {
        inflight = loadBundleFromStore(locale).then((bundle) => {
            cacheBundle(locale, bundle);
            const snapshot = bundleCache.get(locale);
            return snapshot ?? bundle;
        });
        bundlePromises.set(locale, inflight);
    }

    try {
        const base = await inflight;
        return cloneBundle(base);
    } finally {
        bundlePromises.delete(locale);
    }
}

export async function loadStaticConfig(locale: AppLocale) {
    "use cache";
    const normalized = assertLocale(locale);
    unstable_cacheTag(CACHE_TAGS.staticConfig(normalized));
    unstable_cacheLife("hours");
    const bundle = await ensureBundleLoaded(normalized);
    return bundle.config;
}

export function loadStaticConfigSync(locale: AppLocale) {
    const normalized = assertLocale(locale);
    const cached = bundleCache.get(normalized);
    if (cached) {
        return cloneBundle(cached).config;
    }
    const fallback = buildFallbackBundle(normalized);
    cacheBundle(normalized, fallback);
    const snapshot = bundleCache.get(normalized);
    return cloneBundle(snapshot ?? fallback).config;
}

export async function loadMarketingSection(
    locale: AppLocale,
    section: MarketingSection,
) {
    "use cache";
    const normalizedLocale = assertLocale(locale);
    const normalizedSection = toMarketingSection(section);
    unstable_cacheTag(CACHE_TAGS.staticConfig(normalizedLocale));
    unstable_cacheTag(
        CACHE_TAGS.marketingSection(normalizedLocale, normalizedSection),
    );
    unstable_cacheLife("hours");
    const key = getSectionCacheKey(normalizedLocale, normalizedSection);
    const cached = marketingCache.get(key);
    if (cached) {
        return cloneJson(cached);
    }
    const bundle = await ensureBundleLoaded(normalizedLocale);
    const payload =
        bundle.sections[normalizedSection] ??
        createFallbackSection(normalizedLocale, normalizedSection);
    const snapshot = cloneJson(payload);
    marketingCache.set(key, snapshot);
    return cloneJson(snapshot);
}

export function loadMarketingSectionSync(
    locale: AppLocale,
    section: MarketingSection,
) {
    const normalizedLocale = assertLocale(locale);
    const normalizedSection = toMarketingSection(section);
    const key = getSectionCacheKey(normalizedLocale, normalizedSection);
    const cached = marketingCache.get(key);
    if (cached) {
        return cloneJson(cached);
    }
    const snapshot = bundleCache.get(normalizedLocale);
    if (snapshot) {
        const payload =
            snapshot.sections[normalizedSection] ??
            createFallbackSection(normalizedLocale, normalizedSection);
        const snapshotPayload = cloneJson(payload);
        marketingCache.set(key, snapshotPayload);
        return cloneJson(snapshotPayload);
    }
    const fallback = buildFallbackBundle(normalizedLocale);
    cacheBundle(normalizedLocale, fallback);
    const stored = bundleCache.get(normalizedLocale);
    const payload =
        stored?.sections[normalizedSection] ??
        fallback.sections[normalizedSection] ??
        createFallbackSection(normalizedLocale, normalizedSection);
    const snapshotPayload = cloneJson(payload);
    marketingCache.set(key, snapshotPayload);
    return cloneJson(snapshotPayload);
}

export function clearStaticConfigCache() {
    configCache.clear();
    marketingCache.clear();
    bundleCache.clear();
    bundlePromises.clear();
    fallbackCache.clear();
}
