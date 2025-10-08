import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";
import type { AppLocale } from "../i18n/config";
import { defaultLocale, locales } from "../i18n/config";

const createSiteSettings = (
    overrides: Partial<SiteSettingsPayload> = {},
): SiteSettingsPayload => ({
    id: overrides.id,
    siteName: overrides.siteName ?? "",
    domain: overrides.domain ?? "",
    logoUrl: overrides.logoUrl ?? "",
    faviconUrl: overrides.faviconUrl ?? "",
    seoTitle: overrides.seoTitle ?? "",
    seoDescription: overrides.seoDescription ?? "",
    seoOgImage: overrides.seoOgImage ?? "",
    sitemapEnabled: overrides.sitemapEnabled ?? false,
    robotsRules: overrides.robotsRules ?? "",
    brandPrimaryColor: overrides.brandPrimaryColor ?? "#2563eb",
    brandSecondaryColor: overrides.brandSecondaryColor ?? "#0f172a",
    brandFontFamily: overrides.brandFontFamily ?? "Inter",
    headHtml: overrides.headHtml ?? "",
    footerHtml: overrides.footerHtml ?? "",
    defaultLanguage: overrides.defaultLanguage ?? defaultLocale,
    enabledLanguages: overrides.enabledLanguages ?? [defaultLocale],
});
describe("seo helpers", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        vi.restoreAllMocks();
        process.env = { ...originalEnv };
    });

    describe("ensureAbsoluteUrl", () => {
        it("返回基础 URL 当输入为空", async () => {
            const { ensureAbsoluteUrl } = await import("./seo");
            expect(ensureAbsoluteUrl("", "https://example.com/base")).toBe(
                "https://example.com/base",
            );
        });

        it("处理相对路径并保留 query", async () => {
            const { ensureAbsoluteUrl } = await import("./seo");
            expect(
                ensureAbsoluteUrl("blog/post?id=1", "https://example.com"),
            ).toBe("https://example.com/blog/post?id=1");
        });

        it("处理根路径", async () => {
            const { ensureAbsoluteUrl } = await import("./seo");
            expect(ensureAbsoluteUrl("/about", "https://foo.bar")).toBe(
                "https://foo.bar/about",
            );
        });

        it("协议相对路径补全 https", async () => {
            const { ensureAbsoluteUrl } = await import("./seo");
            expect(ensureAbsoluteUrl("//cdn.example.com", "https://foo")).toBe(
                "https://cdn.example.com",
            );
        });

        it("遇到非法基础地址时回退原值", async () => {
            const { ensureAbsoluteUrl } = await import("./seo");
            expect(ensureAbsoluteUrl("javascript:alert(1)", ":::::")).toBe(
                "javascript:alert(1)",
            );
        });
    });

    describe("resolveAppUrl", () => {
        beforeEach(() => {
            vi.resetModules();
        });

        it("优先返回站点配置域名", async () => {
            const module = await import("./seo");
            expect(
                module.resolveAppUrl(
                    createSiteSettings({ domain: "https://my.app" }),
                ),
            ).toBe("https://my.app");
        });

        it("回退到 NEXT_PUBLIC_APP_URL", async () => {
            process.env.NEXT_PUBLIC_APP_URL = "https://env.example";
            const module = await import("./seo");
            expect(module.resolveAppUrl(null)).toBe("https://env.example");
        });

        it("所有候选均无效时抛错", async () => {
            const OriginalURL = URL;
            class FailingURL extends OriginalURL {
                constructor(input: string | URL, base?: string | URL) {
                    if (String(input).includes("localhost:3000")) {
                        throw new Error("unsupported");
                    }
                    super(input, base);
                }
            }
            // @ts-expect-error override for testing
            globalThis.URL = FailingURL;
            try {
                const module = await import("./seo");
                expect(() => module.resolveAppUrl(null)).toThrow(
                    module.AppUrlResolutionError,
                );
            } finally {
                globalThis.URL = OriginalURL;
            }
        });
    });

    describe("getActiveAppLocales", () => {
        it("启用集合为空时返回默认全量", async () => {
            const { getActiveAppLocales } = await import("./seo");
            expect(getActiveAppLocales(null)).toEqual(locales);
        });

        it("过滤无效语言并去重", async () => {
            const { getActiveAppLocales } = await import("./seo");
            expect(
                getActiveAppLocales(
                    createSiteSettings({
                        enabledLanguages: ["en", "fr", "jp", "fr"],
                    }),
                ),
            ).toEqual(["en", "fr"]);
        });
    });

    describe("sanitizeCustomHtml", () => {
        it("保留允许标签并过滤危险属性", async () => {
            const { sanitizeCustomHtml } = await import("./seo");
            const result = sanitizeCustomHtml(
                '<script src="/ok.js" data-id="1" onclick="bad()"></script>' +
                    '<link href="javascript:alert(1)" rel="preload" data-test="x">' +
                    '<meta http-equiv="refresh" content="0;url=https://safe">' +
                    '<style nonce="abc">body { color: red; }</style>',
            );
            expect(result).toEqual([
                {
                    tag: "script",
                    attributes: { src: "/ok.js", "data-id": "1" },
                    content: "",
                },
                {
                    tag: "link",
                    attributes: { rel: "preload", "data-test": "x" },
                },
                {
                    tag: "meta",
                    attributes: {
                        "http-equiv": "refresh",
                        content: "0;url=https://safe",
                    },
                },
                {
                    tag: "style",
                    attributes: { nonce: "abc" },
                    content: "body { color: red; }",
                },
            ]);
        });

        it("允许 aria/data/nonce 属性", async () => {
            const { sanitizeCustomHtml } = await import("./seo");
            const result = sanitizeCustomHtml(
                '<script src="/a.js" aria-hidden="true" nonce="xyz"></script>',
            );
            expect(result[0]?.attributes).toEqual({
                src: "/a.js",
                "aria-hidden": "true",
                nonce: "xyz",
            });
        });
    });

    describe("buildLocalizedPath", () => {
        it("默认语言返回原路径", async () => {
            const { buildLocalizedPath } = await import("./seo");
            expect(buildLocalizedPath(defaultLocale, "/about")).toBe("/about");
        });

        it("其他语言加前缀且处理根路径", async () => {
            const { buildLocalizedPath } = await import("./seo");
            expect(buildLocalizedPath("fr" as AppLocale, "/")).toBe("/fr");
            expect(buildLocalizedPath("de" as AppLocale, "pricing")).toBe(
                "/de/pricing",
            );
        });
    });
});
