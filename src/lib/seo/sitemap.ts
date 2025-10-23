/**
 * 动态站点地图生成工具
 *
 * 功能：
 * - 生成符合Google标准的XML站点地图
 * - 支持多语言站点地图
 * - 自动包含所有重要页面
 * - 支持动态内容（如博客文章、产品页面等）
 * - 生成站点地图索引文件
 */

import type { MetadataRoute } from 'next';
import type { AppLocale } from '@/i18n/config';

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Partial<Record<AppLocale, string>>;
  };
}

interface SitemapOptions {
  baseUrl: string;
  locales: AppLocale[];
  defaultLocale: AppLocale;
  additionalPages?: SitemapEntry[];
  dynamicContent?: {
    posts?: Array<{
      id: string;
      slug: string;
      lastModified: string | Date;
      locale?: AppLocale;
    }>;
    products?: Array<{
      id: string;
      slug: string;
      lastModified: string | Date;
      locale?: AppLocale;
    }>;
    categories?: Array<{
      id: string;
      slug: string;
      lastModified: string | Date;
      locale?: AppLocale;
    }>;
  };
}

/**
 * 生成多语言页面URL
 */
function generateLocalizedUrls(
  baseUrl: string,
  path: string,
  locales: AppLocale[],
  defaultLocale: AppLocale,
  lastModified?: string | Date,
  changeFrequency?: SitemapEntry['changeFrequency'],
  priority?: number
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  locales.forEach(locale => {
    const localizedPath = locale === defaultLocale ? path : `/${locale}${path}`;
    const url = `${baseUrl}${localizedPath}`;

    // 为每种语言生成替代链接
    const alternates = locales.length > 1 ? {
      languages: locales.reduce((acc, lang) => {
        const altPath = lang === defaultLocale ? path : `/${lang}${path}`;
        acc[lang] = `${baseUrl}${altPath}`;
        return acc;
      }, {} as Partial<Record<AppLocale, string>>)
    } : undefined;

    entries.push({
      url,
      lastModified,
      changeFrequency,
      priority,
      alternates
    });
  });

  return entries;
}

/**
 * 获取静态页面列表
 */
function getStaticPages(options: SitemapOptions): SitemapEntry[] {
  const { baseUrl, locales, defaultLocale } = options;

  const staticPages = [
    // 首页
    {
      path: '/',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0
    },
    // 营销页面
    {
      path: '/about',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    },
    {
      path: '/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    },
    {
      path: '/pricing',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9
    },
    {
      path: '/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3
    },
    {
      path: '/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3
    },
    // 认证页面
    {
      path: '/login',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    },
    {
      path: '/signup',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8
    },
    // 用户仪表板
    {
      path: '/dashboard',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7
    },
    {
      path: '/dashboard/todos',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6
    },
    {
      path: '/billing',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6
    },
    {
      path: '/billing/usage',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5
    },
    {
      path: '/billing/success',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4
    },
    {
      path: '/billing/cancel',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4
    }
  ];

  const entries: SitemapEntry[] = [];

  staticPages.forEach(page => {
    const localizedEntries = generateLocalizedUrls(
      baseUrl,
      page.path,
      locales,
      defaultLocale,
      page.lastModified,
      page.changeFrequency,
      page.priority
    );
    entries.push(...localizedEntries);
  });

  return entries;
}

/**
 * 获取动态内容页面
 */
function getDynamicContentPages(options: SitemapOptions): SitemapEntry[] {
  const { baseUrl, locales, defaultLocale, dynamicContent } = options;
  const entries: SitemapEntry[] = [];

  if (!dynamicContent) return entries;

  // 博客文章
  if (dynamicContent.posts) {
    dynamicContent.posts.forEach(post => {
      const path = `/blog/${post.slug}`;
      const locale = post.locale || defaultLocale;
      const localizedPath = locale === defaultLocale ? path : `/${locale}${path}`;
      const url = `${baseUrl}${localizedPath}`;

      entries.push({
        url,
        lastModified: post.lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: locales.length > 1 ? {
          languages: locales.reduce((acc, lang) => {
            const altPath = lang === defaultLocale ? path : `/${lang}${path}`;
            acc[lang] = `${baseUrl}${altPath}`;
            return acc;
          }, {} as Partial<Record<AppLocale, string>>)
        } : undefined
      });
    });
  }

  // 产品页面
  if (dynamicContent.products) {
    dynamicContent.products.forEach(product => {
      const path = `/products/${product.slug}`;
      const locale = product.locale || defaultLocale;
      const localizedPath = locale === defaultLocale ? path : `/${locale}${path}`;
      const url = `${baseUrl}${localizedPath}`;

      entries.push({
        url,
        lastModified: product.lastModified,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: locales.length > 1 ? {
          languages: locales.reduce((acc, lang) => {
            const altPath = lang === defaultLocale ? path : `/${lang}${path}`;
            acc[lang] = `${baseUrl}${altPath}`;
            return acc;
          }, {} as Partial<Record<AppLocale, string>>)
        } : undefined
      });
    });
  }

  // 分类页面
  if (dynamicContent.categories) {
    dynamicContent.categories.forEach(category => {
      const path = `/category/${category.slug}`;
      const locale = category.locale || defaultLocale;
      const localizedPath = locale === defaultLocale ? path : `/${locale}${path}`;
      const url = `${baseUrl}${localizedPath}`;

      entries.push({
        url,
        lastModified: category.lastModified,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: locales.length > 1 ? {
          languages: locales.reduce((acc, lang) => {
            const altPath = lang === defaultLocale ? path : `/${lang}${path}`;
            acc[lang] = `${baseUrl}${altPath}`;
            return acc;
          }, {} as Partial<Record<AppLocale, string>>)
        } : undefined
      });
    });
  }

  return entries;
}

/**
 * 生成XML站点地图
 */
export function generateSitemap(options: SitemapOptions): MetadataRoute.Sitemap {
  const entries: SitemapEntry[] = [];

  // 添加静态页面
  entries.push(...getStaticPages(options));

  // 添加动态内容页面
  entries.push(...getDynamicContentPages(options));

  // 添加额外页面
  if (options.additionalPages) {
    entries.push(...options.additionalPages);
  }

  // 去重并排序
  const uniqueEntries = entries.filter((entry, index, arr) =>
    arr.findIndex(e => e.url === entry.url) === index
  ).sort((a, b) => b.priority! - a.priority!);

  return uniqueEntries as MetadataRoute.Sitemap;
}

/**
 * 生成站点地图索引文件（用于多个站点地图）
 */
export function generateSitemapIndex(
  baseUrl: string,
  sitemaps: Array<{
    path: string;
    lastModified?: string | Date;
  }>
): string {
  const xmlEntries = sitemaps.map(sitemap => `
    <sitemap>
      <loc>${baseUrl}${sitemap.path}</loc>
      ${sitemap.lastModified ? `<lastmod>${new Date(sitemap.lastModified).toISOString()}</lastmod>` : ''}
    </sitemap>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</sitemapindex>`;
}

/**
 * 验证站点地图URL格式
 */
export function validateSitemapUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 获取站点地图统计信息
 */
export function getSitemapStats(sitemap: MetadataRoute.Sitemap): {
  totalUrls: number;
  urlsByChangeFrequency: Record<string, number>;
  averagePriority: number;
  locales: string[];
} {
  const stats = {
    totalUrls: sitemap.length,
    urlsByChangeFrequency: {} as Record<string, number>,
    averagePriority: 0,
    locales: new Set<string>() as Set<string>
  };

  let totalPriority = 0;

  sitemap.forEach(entry => {
    // 统计更新频率
    const freq = entry.changeFrequency || 'unknown';
    stats.urlsByChangeFrequency[freq] = (stats.urlsByChangeFrequency[freq] || 0) + 1;

    // 累计优先级
    totalPriority += entry.priority || 0;

    // 收集语言信息
    if (entry.alternates?.languages) {
      Object.keys(entry.alternates.languages).forEach(locale => {
        stats.locales.add(locale);
      });
    }
  });

  stats.averagePriority = totalPriority / sitemap.length;
  stats.locales = Array.from(stats.locales);

  return stats;
}

/**
 * 生成站点地图配置建议
 */
export function getSitemapRecommendations(stats: ReturnType<typeof getSitemapStats>): {
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 检查URL数量
  if (stats.totalUrls > 50000) {
    issues.push('站点地图URL数量超过50000个，需要拆分为多个站点地图');
    suggestions.push('使用站点地图索引文件管理多个站点地图');
  }

  // 检查平均优先级
  if (stats.averagePriority < 0.5) {
    suggestions.push('提高重要页面的优先级，建议保持在0.5以上');
  }

  // 检查更新频率分布
  const dailyCount = stats.urlsByChangeFrequency['daily'] || 0;
  const weeklyCount = stats.urlsByChangeFrequency['weekly'] || 0;

  if (dailyCount > stats.totalUrls * 0.8) {
    suggestions.push('考虑降低非必要页面的更新频率，避免每日更新');
  }

  // 检查多语言支持
  if (stats.locales.length === 1 && stats.totalUrls > 10) {
    suggestions.push('考虑添加多语言支持以扩展受众范围');
  }

  return { issues, suggestions };
}