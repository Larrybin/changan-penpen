import { MetadataRoute } from "next";
import { getActiveAppLocales, resolveAppUrl } from "@/lib/seo";
import { generateSitemap } from "@/lib/seo/sitemap";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

/**
 * 动态生成XML站点地图
 *
 * 此路由自动生成包含所有重要页面的站点地图，
 * 支持多语言和动态内容，符合Google站点地图标准
 */
export async function GET(): Promise<MetadataRoute.Sitemap> {
    try {
        // 获取站点设置和配置
        const [settings, locales] = await Promise.all([
            getSiteSettingsPayload(),
            getActiveAppLocales(),
        ]);

        const defaultLocale = settings.defaultLanguage;
        const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
        const resolvedAppUrl = resolveAppUrl(settings, { envAppUrl });
        const domain = settings.domain?.trim();
        const baseUrlCandidate = domain
            ? domain.startsWith("http://") || domain.startsWith("https://")
                ? domain
                : `https://${domain}`
            : resolvedAppUrl;

        const baseUrl = baseUrlCandidate || "https://banana-generator.com";

        // 移除末尾斜杠
        const cleanBaseUrl = baseUrl.replace(/\/$/, "");

        // 额外的自定义页面（如果有的话）
        const additionalPages: MetadataRoute.Sitemap = [];

        // 生成站点地图
        const sitemap = generateSitemap({
            baseUrl: cleanBaseUrl,
            locales,
            defaultLocale,
            additionalPages,
            dynamicContent: {
                // 这里可以添加动态内容，如博客文章、产品等
                // 目前为空，未来可以从数据库获取
                posts: [],
                products: [],
                categories: [],
            },
        });

        return sitemap;
    } catch (error) {
        console.error("生成站点地图时出错:", error);

        // 返回基本的站点地图作为回退
        return [
            {
                url: "https://banana-generator.com",
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
            {
                url: "https://banana-generator.com/about",
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.8,
            },
            {
                url: "https://banana-generator.com/contact",
                lastModified: new Date(),
                changeFrequency: "monthly",
                priority: 0.7,
            },
        ] as MetadataRoute.Sitemap;
    }
}
