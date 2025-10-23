/**
 * Canonical URL 工具
 *
 * 功能：
 * - 生成规范的canonical URL
 * - 处理多语言URL
 * - 移除查询参数和片段
 * - 处理相对路径和绝对路径
 * - 支持动态路由
 */

import type { AppLocale } from '@/i18n/config';

interface CanonicalUrlOptions {
  baseUrl?: string;
  locale?: AppLocale;
  defaultLocale?: AppLocale;
  path?: string;
  removeQueryParams?: boolean;
  removeFragment?: boolean;
  addTrailingSlash?: boolean;
}

/**
 * 清理URL - 移除不必要的查询参数和片段
 */
function cleanUrl(
  url: string,
  removeQueryParams: boolean = true,
  removeFragment: boolean = true
): string {
  try {
    const urlObj = new URL(url);

    // 移除常见的非必要查询参数
    if (removeQueryParams) {
      const paramsToRemove = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'fbclid',
        'gclid',
        'msclkid',
        'ttclid',
        '_ga',
        '_gid',
        'ref',
        'source',
        'campaign',
        'medium',
        'content'
      ];

      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
    }

    // 移除片段标识符
    if (removeFragment) {
      urlObj.hash = '';
    }

    return urlObj.toString();
  } catch {
    // 如果URL解析失败，返回原始URL
    return url;
  }
}

/**
 * 确保URL有正确的格式
 */
function normalizeUrl(
  url: string,
  addTrailingSlash: boolean = false
): string {
  try {
    const urlObj = new URL(url);

    // 确保路径不以双斜杠开头
    let path = urlObj.pathname.replace(/\/+/g, '/');

    // 处理根路径
    if (path === '') {
      path = '/';
    }

    // 添加或移除尾部斜杠
    if (addTrailingSlash && !path.endsWith('/') && path !== '/') {
      path += '/';
    } else if (!addTrailingSlash && path.endsWith('/') && path !== '/') {
      path = path.slice(0, -1);
    }

    urlObj.pathname = path;
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * 生成多语言canonical URL
 */
function generateLocalizedUrl(
  baseUrl: string,
  path: string,
  locale: AppLocale,
  defaultLocale: AppLocale,
  addTrailingSlash: boolean = false
): string {
  // 清理路径
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 构建本地化路径
  let localizedPath: string;
  if (locale === defaultLocale) {
    localizedPath = cleanPath;
  } else {
    localizedPath = `/${locale}${cleanPath}`;
  }

  // 组合完整URL
  const fullUrl = `${baseUrl}${localizedPath}`;

  // 规范化URL
  return normalizeUrl(fullUrl, addTrailingSlash);
}

/**
 * 生成canonical URL
 */
export function generateCanonicalUrl(options: CanonicalUrlOptions): string {
  const {
    baseUrl,
    locale,
    defaultLocale,
    path = '/',
    removeQueryParams = true,
    removeFragment = true,
    addTrailingSlash = false
  } = options;

  // 获取基础URL
  const canonicalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://banana-generator.com';

  // 清理基础URL
  const cleanBaseUrl = canonicalBaseUrl.replace(/\/$/, '');

  // 生成本地化URL
  const localizedUrl = locale && defaultLocale
    ? generateLocalizedUrl(cleanBaseUrl, path, locale, defaultLocale, addTrailingSlash)
    : `${cleanBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // 清理URL
  const cleanedUrl = cleanUrl(localizedUrl, removeQueryParams, removeFragment);

  // 规范化URL
  return normalizeUrl(cleanedUrl, addTrailingSlash);
}

/**
 * 从当前请求生成交互canonical URL
 */
export function getCurrentCanonicalUrl(
  request: Request,
  options: Omit<CanonicalUrlOptions, 'baseUrl'> & {
    locale?: AppLocale;
    defaultLocale?: AppLocale;
  } = {}
): string {
  const url = new URL(request.url);

  return generateCanonicalUrl({
    baseUrl: `${url.protocol}//${url.host}`,
    path: url.pathname + url.search,
    ...options
  });
}

/**
 * 生成分页canonical URL
 */
export function generatePaginatedCanonicalUrl(
  baseUrl: string,
  basePath: string,
  page: number,
  options: Omit<CanonicalUrlOptions, 'path'> & {
    pageParam?: string;
    totalPages?: number;
  } = {}
): string {
  const { pageParam = 'page', totalPages, ...canonicalOptions } = options;

  if (page <= 1) {
    // 第一页不需要分页参数
    return generateCanonicalUrl({
      ...canonicalOptions,
      baseUrl,
      path: basePath
    });
  }

  const pagePath = totalPages && page > totalPages
    ? basePath // 如果超过总页数，回到第一页
    : `${basePath}?${pageParam}=${page}`;

  return generateCanonicalUrl({
    ...canonicalOptions,
    baseUrl,
    path: pagePath
  });
}

/**
 * 生成hreflang标签
 */
export function generateHreflangTags(
  canonicalUrl: string,
  locales: AppLocale[],
  currentLocale: AppLocale,
  defaultLocale: AppLocale,
  options: {
    path?: string;
    addTrailingSlash?: boolean;
  } = {}
): Array<{ rel: string; hrefLang: string; href: string }> {
  const { path = '/', addTrailingSlash = false } = options;
  const baseUrl = canonicalUrl.replace(/\/[^\/]*$/, ''); // 移除路径部分

  const tags: Array<{ rel: string; hrefLang: string; href: string }> = [];

  // 为每种语言生成hreflang标签
  locales.forEach(locale => {
    const localizedUrl = generateCanonicalUrl({
      baseUrl,
      locale,
      defaultLocale,
      path,
      addTrailingSlash
    });

    tags.push({
      rel: 'alternate',
      hrefLang: locale,
      href: localizedUrl
    });
  });

  // 添加x-default标签
  const defaultUrl = generateCanonicalUrl({
    baseUrl,
    locale: defaultLocale,
    defaultLocale,
    path,
    addTrailingSlash
  });

  tags.push({
    rel: 'alternate',
    hrefLang: 'x-default',
    href: defaultUrl
  });

  // 添加canonical标签
  tags.push({
    rel: 'canonical',
    hrefLang: currentLocale,
    href: canonicalUrl
  });

  return tags;
}

/**
 * 验证canonical URL
 */
export function validateCanonicalUrl(url: string): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];

  try {
    const urlObj = new URL(url);

    // 检查协议
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL必须使用HTTP或HTTPS协议');
    }

    // 检查域名
    if (!urlObj.hostname) {
      errors.push('URL必须包含有效的域名');
    }

    // 检查路径
    if (urlObj.pathname.includes('//')) {
      suggestions.push('路径中包含双斜杠，建议简化');
    }

    // 检查查询参数
    if (urlObj.search) {
      const hasTrackingParams = /[?&](utm_|fbclid|gclid|msclkid)/.test(urlObj.search);
      if (hasTrackingParams) {
        suggestions.push('canonical URL不应包含跟踪参数');
      }
    }

    // 检查片段
    if (urlObj.hash) {
      suggestions.push('canonical URL不应包含片段标识符(#)');
    }

    return { isValid: errors.length === 0, errors, suggestions };
  } catch (error) {
    return {
      isValid: false,
      errors: [`无效的URL格式: ${error instanceof Error ? error.message : '未知错误'}`],
      suggestions: ['请确保URL格式正确，如：https://example.com/page']
    };
  }
}

/**
 * 从相对路径生成绝对canonical URL
 */
export function resolveRelativeUrl(
  relativePath: string,
  baseUrl: string,
  options: Omit<CanonicalUrlOptions, 'baseUrl' | 'path'> = {}
): string {
  const cleanRelativePath = relativePath.startsWith('/')
    ? relativePath
    : `/${relativePath}`;

  return generateCanonicalUrl({
    ...options,
    baseUrl,
    path: cleanRelativePath
  });
}