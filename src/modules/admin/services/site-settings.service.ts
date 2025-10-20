import { eq } from "drizzle-orm";
import { getDb, siteSettings } from "@/db";
import {
    type AppLocale,
    getSupportedAppLocales,
    setRuntimeI18nConfig,
} from "@/i18n/config";
import {
    clearSiteSettingsCache,
    getCachedSiteSettings,
    setCachedSiteSettings,
} from "@/modules/admin/services/site-settings-cache";

export type LocalizedSeoFieldMap = Partial<Record<AppLocale, string>>;

export interface SiteSettingsPayload {
    id?: number;
    siteName: string;
    domain: string;
    logoUrl: string;
    faviconUrl: string;
    seoTitle: string;
    seoDescription: string;
    seoOgImage: string;
    seoTitleLocalized: LocalizedSeoFieldMap;
    seoDescriptionLocalized: LocalizedSeoFieldMap;
    seoOgImageLocalized: LocalizedSeoFieldMap;
    sitemapEnabled: boolean;
    robotsRules: string;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandFontFamily: string;
    headHtml: string;
    footerHtml: string;
    defaultLanguage: AppLocale;
    enabledLanguages: AppLocale[];
}

const EMPTY_SETTINGS: SiteSettingsPayload = {
    id: undefined,
    siteName: "",
    domain: "",
    logoUrl: "",
    faviconUrl: "",
    seoTitle: "",
    seoDescription: "",
    seoOgImage: "",
    seoTitleLocalized: {},
    seoDescriptionLocalized: {},
    seoOgImageLocalized: {},
    sitemapEnabled: true,
    robotsRules: "",
    brandPrimaryColor: "#2563eb",
    brandSecondaryColor: "#0f172a",
    brandFontFamily: "Inter",
    headHtml: "",
    footerHtml: "",
    defaultLanguage: "en",
    enabledLanguages: ["en"],
};

const SUPPORTED_LOCALE_SET = new Set<AppLocale>(
    getSupportedAppLocales() as AppLocale[],
);

function toAppLocale(value: string | null | undefined): AppLocale | null {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return SUPPORTED_LOCALE_SET.has(trimmed as AppLocale)
        ? (trimmed as AppLocale)
        : null;
}

function sanitizeEnabledLocales(
    enabled: string[] | undefined,
    fallback: AppLocale,
): AppLocale[] {
    const result = new Set<AppLocale>();
    if (Array.isArray(enabled)) {
        for (const locale of enabled) {
            const normalized = toAppLocale(locale);
            if (normalized) {
                result.add(normalized);
            }
        }
    }
    if (!result.size) {
        result.add(fallback);
    } else if (!result.has(fallback)) {
        result.add(fallback);
    }
    return Array.from(result);
}

function sanitizeLocalizedInput(
    base: LocalizedSeoFieldMap,
    input?: Record<string, unknown>,
): LocalizedSeoFieldMap {
    if (!input) {
        return { ...base };
    }
    const sanitized: LocalizedSeoFieldMap = { ...base };
    for (const [locale, value] of Object.entries(input)) {
        const normalized = toAppLocale(locale);
        if (!normalized) {
            continue;
        }
        if (typeof value !== "string") {
            continue;
        }
        const trimmed = value.trim();
        if (!trimmed.length) {
            delete sanitized[normalized];
            continue;
        }
        sanitized[normalized] = trimmed;
    }
    return sanitized;
}

function parseLocalizedJson(value: string | null | undefined) {
    if (!value) {
        return {} as Record<string, string>;
    }
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        const result: Record<string, string> = {};
        for (const [locale, raw] of Object.entries(parsed ?? {})) {
            if (typeof raw !== "string") {
                continue;
            }
            result[locale] = raw;
        }
        return result;
    } catch (error) {
        console.warn("Failed to parse localized SEO settings", { error });
        return {} as Record<string, string>;
    }
}

function syncRuntimeLocales(settings: SiteSettingsPayload) {
    setRuntimeI18nConfig({
        locales: settings.enabledLanguages,
        defaultLocale: settings.defaultLanguage,
    });
}

function hasCloudflareBindings(env: NodeJS.ProcessEnv | undefined) {
    if (!env) {
        return false;
    }

    if (env.CF_PAGES === "1" || env.CF_WORKER === "1") {
        return true;
    }

    const accountId = env.CLOUDFLARE_ACCOUNT_ID ?? env.CF_ACCOUNT_ID;
    const hasApiToken =
        env.CLOUDFLARE_API_TOKEN ?? env.CLOUDFLARE_GLOBAL_API_KEY;

    return Boolean(accountId && hasApiToken);
}

function shouldBypassDatabaseForStaticBuild() {
    if (typeof globalThis.process === "undefined") {
        return false;
    }

    const env = globalThis.process.env;
    if (!env) {
        return false;
    }

    if (env.NEXT_PHASE !== "phase-production-build") {
        return false;
    }

    return !hasCloudflareBindings(env);
}

function mapRowToPayload(
    row: typeof siteSettings.$inferSelect,
): SiteSettingsPayload {
    const defaultLanguage =
        toAppLocale(row.defaultLanguage) ?? EMPTY_SETTINGS.defaultLanguage;

    let enabledLanguagesRaw: string[] = [];
    if (row.enabledLanguages) {
        try {
            enabledLanguagesRaw = JSON.parse(row.enabledLanguages);
        } catch (error) {
            console.warn(
                "Failed to parse enabled languages from site settings",
                error,
            );
            enabledLanguagesRaw = [];
        }
    }

    const seoTitleLocalized = sanitizeLocalizedInput(
        {},
        parseLocalizedJson(row.seoTitleLocalized),
    );
    const seoDescriptionLocalized = sanitizeLocalizedInput(
        {},
        parseLocalizedJson(row.seoDescriptionLocalized),
    );
    const seoOgImageLocalized = sanitizeLocalizedInput(
        {},
        parseLocalizedJson(row.seoOgImageLocalized),
    );

    const resolvedSeoTitle =
        row.seoTitle ?? seoTitleLocalized[defaultLanguage] ?? "";
    const resolvedSeoDescription =
        row.seoDescription ?? seoDescriptionLocalized[defaultLanguage] ?? "";
    const resolvedSeoOgImage =
        row.seoOgImage ?? seoOgImageLocalized[defaultLanguage] ?? "";

    return {
        id: row.id ?? undefined,
        siteName: row.siteName ?? "",
        domain: row.domain ?? "",
        logoUrl: row.logoUrl ?? "",
        faviconUrl: row.faviconUrl ?? "",
        seoTitle: resolvedSeoTitle,
        seoDescription: resolvedSeoDescription,
        seoOgImage: resolvedSeoOgImage,
        seoTitleLocalized,
        seoDescriptionLocalized,
        seoOgImageLocalized,
        sitemapEnabled:
            row.sitemapEnabled === null || row.sitemapEnabled === undefined
                ? true
                : Boolean(row.sitemapEnabled),
        robotsRules: row.robotsRules ?? "",
        brandPrimaryColor: row.brandPrimaryColor ?? "#2563eb",
        brandSecondaryColor: row.brandSecondaryColor ?? "#0f172a",
        brandFontFamily: row.brandFontFamily ?? "Inter",
        headHtml: row.headHtml ?? "",
        footerHtml: row.footerHtml ?? "",
        defaultLanguage,
        enabledLanguages: sanitizeEnabledLocales(
            enabledLanguagesRaw,
            defaultLanguage,
        ),
    };
}

export async function getSiteSettingsPayload(): Promise<SiteSettingsPayload> {
    const cached = getCachedSiteSettings<SiteSettingsPayload>();
    if (cached) {
        syncRuntimeLocales(cached);
        return cached;
    }

    if (shouldBypassDatabaseForStaticBuild()) {
        setCachedSiteSettings(EMPTY_SETTINGS);
        syncRuntimeLocales(EMPTY_SETTINGS);
        return EMPTY_SETTINGS;
    }

    try {
        const db = await getDb();
        const rows = await db.select().from(siteSettings).limit(1);

        if (!rows.length) {
            setCachedSiteSettings(EMPTY_SETTINGS);
            syncRuntimeLocales(EMPTY_SETTINGS);
            return EMPTY_SETTINGS;
        }

        const payload = mapRowToPayload(rows[0]);
        setCachedSiteSettings(payload);
        syncRuntimeLocales(payload);
        return payload;
    } catch (error) {
        console.warn("Failed to load site settings from database", error);
        setCachedSiteSettings(EMPTY_SETTINGS);
        syncRuntimeLocales(EMPTY_SETTINGS);
        return EMPTY_SETTINGS;
    }
}

export interface UpdateSiteSettingsInput {
    siteName?: string;
    domain?: string;
    logoUrl?: string;
    faviconUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoOgImage?: string;
    seoTitleLocalized?: Record<string, string>;
    seoDescriptionLocalized?: Record<string, string>;
    seoOgImageLocalized?: Record<string, string>;
    sitemapEnabled?: boolean;
    robotsRules?: string;
    brandPrimaryColor?: string;
    brandSecondaryColor?: string;
    brandFontFamily?: string;
    headHtml?: string;
    footerHtml?: string;
    defaultLanguage?: string;
    enabledLanguages?: string[];
}

function buildNextPayload(
    basePayload: SiteSettingsPayload,
    input: UpdateSiteSettingsInput,
): SiteSettingsPayload {
    const defaultLanguage =
        toAppLocale(input.defaultLanguage) ?? basePayload.defaultLanguage;
    const nextPayload: SiteSettingsPayload = {
        ...basePayload,
        ...input,
        defaultLanguage,
        enabledLanguages: [...basePayload.enabledLanguages],
        seoTitleLocalized: sanitizeLocalizedInput(
            basePayload.seoTitleLocalized,
            input.seoTitleLocalized,
        ),
        seoDescriptionLocalized: sanitizeLocalizedInput(
            basePayload.seoDescriptionLocalized,
            input.seoDescriptionLocalized,
        ),
        seoOgImageLocalized: sanitizeLocalizedInput(
            basePayload.seoOgImageLocalized,
            input.seoOgImageLocalized,
        ),
    };

    if (input.enabledLanguages !== undefined) {
        nextPayload.enabledLanguages = sanitizeEnabledLocales(
            input.enabledLanguages,
            defaultLanguage,
        );
    } else {
        nextPayload.enabledLanguages = sanitizeEnabledLocales(
            nextPayload.enabledLanguages,
            defaultLanguage,
        );
    }

    const localizedTitle = nextPayload.seoTitleLocalized[defaultLanguage];
    if (localizedTitle && !input.seoTitle) {
        nextPayload.seoTitle = localizedTitle;
    }
    const localizedDescription =
        nextPayload.seoDescriptionLocalized[defaultLanguage];
    if (localizedDescription && !input.seoDescription) {
        nextPayload.seoDescription = localizedDescription;
    }
    const localizedOgImage = nextPayload.seoOgImageLocalized[defaultLanguage];
    if (localizedOgImage && !input.seoOgImage) {
        nextPayload.seoOgImage = localizedOgImage;
    }

    return nextPayload;
}
export async function updateSiteSettings(
    input: UpdateSiteSettingsInput,
    adminEmail: string,
) {
    const db = await getDb();
    const rows = await db.select().from(siteSettings).limit(1);
    const basePayload = rows.length
        ? mapRowToPayload(rows[0])
        : { ...EMPTY_SETTINGS };
    const now = new Date().toISOString();

    const nextPayload: SiteSettingsPayload = buildNextPayload(
        basePayload,
        input,
    );

    const payload = {
        siteName: nextPayload.siteName,
        domain: nextPayload.domain,
        logoUrl: nextPayload.logoUrl,
        faviconUrl: nextPayload.faviconUrl,
        seoTitle: nextPayload.seoTitle,
        seoDescription: nextPayload.seoDescription,
        seoOgImage: nextPayload.seoOgImage,
        seoTitleLocalized: JSON.stringify(nextPayload.seoTitleLocalized),
        seoDescriptionLocalized: JSON.stringify(
            nextPayload.seoDescriptionLocalized,
        ),
        seoOgImageLocalized: JSON.stringify(nextPayload.seoOgImageLocalized),
        sitemapEnabled: nextPayload.sitemapEnabled,
        robotsRules: nextPayload.robotsRules,
        brandPrimaryColor: nextPayload.brandPrimaryColor,
        brandSecondaryColor: nextPayload.brandSecondaryColor,
        brandFontFamily: nextPayload.brandFontFamily,
        headHtml: nextPayload.headHtml,
        footerHtml: nextPayload.footerHtml,
        defaultLanguage: nextPayload.defaultLanguage,
        enabledLanguages: JSON.stringify(nextPayload.enabledLanguages),
        updatedAt: now,
    };

    if (rows.length) {
        const existing = rows[0];
        if (!existing?.id) {
            throw new Error("Site settings record is missing an id");
        }
        await db
            .update(siteSettings)
            .set(payload)
            .where(eq(siteSettings.id, existing.id));
    } else {
        await db.insert(siteSettings).values({
            ...payload,
            createdAt: now,
        });
    }

    clearSiteSettingsCache();
    const fresh = await getSiteSettingsPayload();

    await recordSettingsAudit(adminEmail, input);

    return fresh;
}

async function recordSettingsAudit(
    adminEmail: string,
    input: UpdateSiteSettingsInput,
) {
    const { recordAdminAuditLog } = await import(
        "@/modules/admin/services/system-audit.service"
    );
    await recordAdminAuditLog({
        adminEmail,
        action: "update_site_settings",
        targetType: "site_settings",
        metadata: JSON.stringify(input ?? {}),
    });
}
