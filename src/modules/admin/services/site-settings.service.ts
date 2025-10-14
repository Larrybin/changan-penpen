import { eq } from "drizzle-orm";
import { getDb, siteSettings } from "@/db";
import {
    clearSiteSettingsCache,
    getCachedSiteSettings,
    setCachedSiteSettings,
} from "@/modules/admin/services/site-settings-cache";

export interface SiteSettingsPayload {
    id?: number;
    siteName: string;
    domain: string;
    logoUrl: string;
    faviconUrl: string;
    seoTitle: string;
    seoDescription: string;
    seoOgImage: string;
    sitemapEnabled: boolean;
    robotsRules: string;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandFontFamily: string;
    headHtml: string;
    footerHtml: string;
    defaultLanguage: string;
    enabledLanguages: string[];
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
    sitemapEnabled: false,
    robotsRules: "",
    brandPrimaryColor: "#2563eb",
    brandSecondaryColor: "#0f172a",
    brandFontFamily: "Inter",
    headHtml: "",
    footerHtml: "",
    defaultLanguage: "en",
    enabledLanguages: ["en"],
};

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
    let enabledLanguages: string[] = [];
    if (row.enabledLanguages) {
        try {
            enabledLanguages = JSON.parse(row.enabledLanguages);
        } catch (error) {
            console.warn(
                "Failed to parse enabled languages from site settings",
                error,
            );
            enabledLanguages = [];
        }
    }

    return {
        id: row.id ?? undefined,
        siteName: row.siteName ?? "",
        domain: row.domain ?? "",
        logoUrl: row.logoUrl ?? "",
        faviconUrl: row.faviconUrl ?? "",
        seoTitle: row.seoTitle ?? "",
        seoDescription: row.seoDescription ?? "",
        seoOgImage: row.seoOgImage ?? "",
        sitemapEnabled: Boolean(row.sitemapEnabled),
        robotsRules: row.robotsRules ?? "",
        brandPrimaryColor: row.brandPrimaryColor ?? "#2563eb",
        brandSecondaryColor: row.brandSecondaryColor ?? "#0f172a",
        brandFontFamily: row.brandFontFamily ?? "Inter",
        headHtml: row.headHtml ?? "",
        footerHtml: row.footerHtml ?? "",
        defaultLanguage: row.defaultLanguage ?? "en",
        enabledLanguages: enabledLanguages.length
            ? enabledLanguages
            : [row.defaultLanguage ?? "en"],
    };
}

export async function getSiteSettingsPayload(): Promise<SiteSettingsPayload> {
    const cached = getCachedSiteSettings<SiteSettingsPayload>();
    if (cached) {
        return cached;
    }

    if (shouldBypassDatabaseForStaticBuild()) {
        setCachedSiteSettings(EMPTY_SETTINGS);
        return EMPTY_SETTINGS;
    }

    try {
        const db = await getDb();
        const rows = await db.select().from(siteSettings).limit(1);

        if (!rows.length) {
            setCachedSiteSettings(EMPTY_SETTINGS);
            return EMPTY_SETTINGS;
        }

        const payload = mapRowToPayload(rows[0]);
        setCachedSiteSettings(payload);
        return payload;
    } catch (error) {
        console.warn("Failed to load site settings from database", error);
        setCachedSiteSettings(EMPTY_SETTINGS);
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
    const nextPayload: SiteSettingsPayload = {
        ...basePayload,
        ...input,
        enabledLanguages: [...basePayload.enabledLanguages],
    };

    if (input.enabledLanguages !== undefined) {
        const fallbackLanguage = nextPayload.defaultLanguage ?? "en";
        nextPayload.enabledLanguages =
            input.enabledLanguages.length > 0
                ? [...input.enabledLanguages]
                : [fallbackLanguage];
    }

    if (
        nextPayload.defaultLanguage &&
        !nextPayload.enabledLanguages.includes(nextPayload.defaultLanguage)
    ) {
        nextPayload.enabledLanguages = [
            nextPayload.defaultLanguage,
            ...nextPayload.enabledLanguages,
        ].filter((language, index, arr) => arr.indexOf(language) === index);
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
