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

    const db = await getDb();
    const rows = await db.select().from(siteSettings).limit(1);

    if (!rows.length) {
        setCachedSiteSettings(EMPTY_SETTINGS);
        return EMPTY_SETTINGS;
    }

    const payload = mapRowToPayload(rows[0]);
    setCachedSiteSettings(payload);
    return payload;
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

export async function updateSiteSettings(
    input: UpdateSiteSettingsInput,
    adminEmail: string,
) {
    const db = await getDb();
    const rows = await db.select().from(siteSettings).limit(1);
    const now = new Date().toISOString();
    const payload = {
        siteName: input.siteName ?? "",
        domain: input.domain ?? "",
        logoUrl: input.logoUrl ?? "",
        faviconUrl: input.faviconUrl ?? "",
        seoTitle: input.seoTitle ?? "",
        seoDescription: input.seoDescription ?? "",
        seoOgImage: input.seoOgImage ?? "",
        sitemapEnabled: Boolean(input.sitemapEnabled),
        robotsRules: input.robotsRules ?? "",
        brandPrimaryColor: input.brandPrimaryColor ?? "#2563eb",
        brandSecondaryColor: input.brandSecondaryColor ?? "#0f172a",
        brandFontFamily: input.brandFontFamily ?? "Inter",
        headHtml: input.headHtml ?? "",
        footerHtml: input.footerHtml ?? "",
        defaultLanguage: input.defaultLanguage ?? "en",
        enabledLanguages: JSON.stringify(
            input.enabledLanguages?.length
                ? input.enabledLanguages
                : [input.defaultLanguage ?? "en"],
        ),
        updatedAt: now,
    };

    if (rows.length) {
        await db
            .update(siteSettings)
            .set(payload)
            .where(eq(siteSettings.id, rows[0].id!));
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
