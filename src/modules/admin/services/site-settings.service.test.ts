import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SiteSettingsPayload } from "./site-settings.service";
import { updateSiteSettings } from "./site-settings.service";

const { dbState } = vi.hoisted(() => ({
    dbState: {
        row: null as {
            id: number;
            siteName: string;
            domain: string;
            logoUrl: string;
            faviconUrl: string;
            seoTitle: string;
            seoDescription: string;
            seoOgImage: string;
            seoTitleLocalized: string | null;
            seoDescriptionLocalized: string | null;
            seoOgImageLocalized: string | null;
            sitemapEnabled: number;
            robotsRules: string;
            brandPrimaryColor: string;
            brandSecondaryColor: string;
            brandFontFamily: string;
            headHtml: string;
            footerHtml: string;
            defaultLanguage: string;
            enabledLanguages: string;
            createdAt?: string;
            updatedAt?: string;
        } | null,
    },
}));

const {
    cacheState,
    clearSiteSettingsCacheMock,
    getCachedSiteSettingsMock,
    setCachedSiteSettingsMock,
} = vi.hoisted(() => {
    const cacheState = { value: null as SiteSettingsPayload | null };
    return {
        cacheState,
        clearSiteSettingsCacheMock: vi.fn(() => {
            cacheState.value = null;
        }),
        getCachedSiteSettingsMock: vi.fn(() => cacheState.value),
        setCachedSiteSettingsMock: vi.fn((value: SiteSettingsPayload) => {
            cacheState.value = value;
        }),
    };
});

const { recordAdminAuditLogMock } = vi.hoisted(() => ({
    recordAdminAuditLogMock: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn(() => ({})),
}));

vi.mock("@/db", () => ({
    getDb: vi.fn(async () => ({
        select: () => ({
            from: () => ({
                limit: async () => (dbState.row ? [dbState.row] : []),
            }),
        }),
        update: () => ({
            set: (payload: Record<string, unknown>) => ({
                where: async () => {
                    if (!dbState.row) {
                        throw new Error("No existing row to update");
                    }
                    dbState.row = {
                        ...dbState.row,
                        ...payload,
                    };
                },
            }),
        }),
        insert: () => ({
            values: async (values: Record<string, unknown>) => {
                dbState.row = {
                    id: 1,
                    siteName: "",
                    domain: "",
                    logoUrl: "",
                    faviconUrl: "",
                    seoTitle: "",
                    seoDescription: "",
                    seoOgImage: "",
                    seoTitleLocalized: "{}",
                    seoDescriptionLocalized: "{}",
                    seoOgImageLocalized: "{}",
                    sitemapEnabled: 0,
                    robotsRules: "",
                    brandPrimaryColor: "#2563eb",
                    brandSecondaryColor: "#0f172a",
                    brandFontFamily: "Inter",
                    headHtml: "",
                    footerHtml: "",
                    defaultLanguage: "en",
                    enabledLanguages: '["en"]',
                    ...values,
                } as typeof dbState.row;
            },
        }),
    })),
    siteSettings: {
        id: Symbol("siteSettings.id"),
    },
}));

vi.mock("@/modules/admin/services/site-settings-cache", () => ({
    clearSiteSettingsCache: clearSiteSettingsCacheMock,
    getCachedSiteSettings: getCachedSiteSettingsMock,
    setCachedSiteSettings: setCachedSiteSettingsMock,
}));

vi.mock("@/modules/admin/services/system-audit.service", () => ({
    recordAdminAuditLog: recordAdminAuditLogMock,
}));

describe("updateSiteSettings", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cacheState.value = null;
        dbState.row = {
            id: 1,
            siteName: "Base Site",
            domain: "example.com",
            logoUrl: "logo.png",
            faviconUrl: "favicon.ico",
            seoTitle: "Base Title",
            seoDescription: "Base Description",
            seoOgImage: "og.png",
            seoTitleLocalized: "{}",
            seoDescriptionLocalized: "{}",
            seoOgImageLocalized: "{}",
            sitemapEnabled: 1,
            robotsRules: "",
            brandPrimaryColor: "#2563eb",
            brandSecondaryColor: "#0f172a",
            brandFontFamily: "Inter",
            headHtml: "",
            footerHtml: "",
            defaultLanguage: "en",
            enabledLanguages: '["en"]',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    });

    afterEach(() => {
        cacheState.value = null;
        dbState.row = null;
    });

    it("更新站点设置并刷新缓存", async () => {
        const result = await updateSiteSettings(
            {
                siteName: "Updated Site",
                seoTitle: "Updated Title",
            },
            "admin@example.com",
        );

        expect(result.siteName).toBe("Updated Site");
        expect(result.seoTitle).toBe("Updated Title");
        expect(dbState.row?.siteName).toBe("Updated Site");
        expect(clearSiteSettingsCacheMock).toHaveBeenCalled();
        expect(setCachedSiteSettingsMock).toHaveBeenCalledWith(
            expect.objectContaining({ siteName: "Updated Site" }),
        );
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail: "admin@example.com",
            action: "update_site_settings",
            targetType: "site_settings",
            metadata: JSON.stringify({
                siteName: "Updated Site",
                seoTitle: "Updated Title",
            }),
        });
    });

    it("在语言数组为空时回退到默认语言", async () => {
        const result = await updateSiteSettings(
            {
                defaultLanguage: "fr",
                enabledLanguages: [],
            },
            "admin@example.com",
        );

        expect(result.defaultLanguage).toBe("fr");
        expect(result.enabledLanguages).toEqual(["fr"]);
        expect(dbState.row?.enabledLanguages).toBe('["fr"]');
        expect(setCachedSiteSettingsMock).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultLanguage: "fr",
                enabledLanguages: ["fr"],
            }),
        );
    });

    it("合并多语言 SEO 字段并同步默认语言值", async () => {
        if (dbState.row) {
            dbState.row.seoTitleLocalized = JSON.stringify({
                en: "Base Title",
            });
        }

        const result = await updateSiteSettings(
            {
                defaultLanguage: "fr",
                seoTitleLocalized: { fr: "Titre personnalisé" },
            },
            "admin@example.com",
        );

        expect(result.defaultLanguage).toBe("fr");
        expect(result.seoTitleLocalized.fr).toBe("Titre personnalisé");
        expect(result.seoTitle).toBe("Titre personnalisé");
        expect(dbState.row?.seoTitleLocalized).toContain('"fr"');
    });
});
