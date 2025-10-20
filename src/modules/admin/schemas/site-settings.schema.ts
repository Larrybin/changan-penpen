import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const siteSettings = sqliteTable("site_settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    siteName: text("site_name"),
    domain: text("domain"),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoOgImage: text("seo_og_image"),
    seoTitleLocalized: text("seo_title_localized"),
    seoDescriptionLocalized: text("seo_description_localized"),
    seoOgImageLocalized: text("seo_og_image_localized"),
    sitemapEnabled: integer("sitemap_enabled", { mode: "boolean" })
        .notNull()
        .default(false),
    robotsRules: text("robots_rules"),
    brandPrimaryColor: text("brand_primary_color"),
    brandSecondaryColor: text("brand_secondary_color"),
    brandFontFamily: text("brand_font_family"),
    headHtml: text("head_html"),
    footerHtml: text("footer_html"),
    defaultLanguage: text("default_language"),
    enabledLanguages: text("enabled_languages"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
});
