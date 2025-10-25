/**
 * SEO Scanner Service
 * SEO扫描服务
 * 用于检查页面SEO健康状况和计算SEO评分
 */

import { z } from 'zod';

// React Hook将在组件文件中定义

// SEO评分阈值
export const SEO_THRESHOLDS = {
    title: {
        minLength: 30,
        maxLength: 60,
        ideal: 50
    },
    description: {
        minLength: 120,
        maxLength: 160,
        ideal: 150
    },
    h1: {
        maxCount: 1,
        minLength: 20,
        maxLength: 70
    },
    image: {
        maxAltLength: 125,
        minAltLength: 10
    },
    link: {
        maxInternalLinks: 150,
        minInternalLinks: 10
    }
} as const;

// SEO检查结果类型
export const SEOCheckResultSchema = z.object({
    score: z.number().min(0).max(100),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    checks: z.object({
        title: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        description: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        headings: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        images: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        links: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        metaTags: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        structuredData: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        }),
        performance: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number(),
            issues: z.array(z.string()),
            recommendations: z.array(z.string())
        })
    }),
    summary: z.object({
        totalIssues: z.number(),
        criticalIssues: z.number(),
        warnings: z.number(),
        passedChecks: z.number()
    }),
    timestamp: z.string()
});

export type SEOCheckResult = z.infer<typeof SEOCheckResultSchema>;

/**
 * SEO扫描器类
 */
export class SEOScanner {
    private cache = new Map<string, { result: SEOCheckResult; timestamp: number }>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

    /**
     * 执行完整的SEO检查
     */
    async scanPage(url?: string): Promise<SEOCheckResult> {
        const cacheKey = url || window.location.href;
        const cached = this.getCachedResult(cacheKey);

        if (cached) {
            return cached;
        }

        const checks = await Promise.all([
            this.checkTitle(),
            this.checkDescription(),
            this.checkHeadings(),
            this.checkImages(),
            this.checkLinks(),
            this.checkMetaTags(),
            this.checkStructuredData(),
            this.checkPerformance()
        ]);

        const [title, description, headings, images, links, metaTags, structuredData, performance] = checks;

        // 计算总分
        const scores = [title.score, description.score, headings.score, images.score,
                       links.score, metaTags.score, structuredData.score, performance.score];
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // 统计问题
        const allChecks = [title, description, headings, images, links, metaTags, structuredData, performance];
        const totalIssues = allChecks.reduce((sum, check) => sum + check.issues.length, 0);
        const criticalIssues = allChecks.filter(check => check.status === 'fail').length;
        const warnings = allChecks.filter(check => check.status === 'warning').length;
        const passedChecks = allChecks.filter(check => check.status === 'pass').length;

        const result: SEOCheckResult = {
            score: averageScore,
            grade: this.calculateGrade(averageScore),
            checks: {
                title,
                description,
                headings,
                images,
                links,
                metaTags,
                structuredData,
                performance
            },
            summary: {
                totalIssues,
                criticalIssues,
                warnings,
                passedChecks
            },
            timestamp: new Date().toISOString()
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * 检查页面标题
     */
    private async checkTitle() {
        const title = document.title;
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 0;
        let status: 'pass' | 'warning' | 'fail' = 'fail';

        if (!title) {
            issues.push('页面缺少标题');
            recommendations.push('添加描述性的页面标题');
        } else {
            const length = title.length;

            if (length < SEO_THRESHOLDS.title.minLength) {
                issues.push(`标题过短 (${length} 字符)`);
                recommendations.push(`标题长度应至少 ${SEO_THRESHOLDS.title.minLength} 字符`);
            } else if (length > SEO_THRESHOLDS.title.maxLength) {
                issues.push(`标题过长 (${length} 字符)`);
                recommendations.push(`标题长度不应超过 ${SEO_THRESHOLDS.title.maxLength} 字符`);
            }

            if (length >= SEO_THRESHOLDS.title.minLength && length <= SEO_THRESHOLDS.title.maxLength) {
                score = 100;
                status = 'pass';
            } else if (length > 0) {
                score = 50;
                status = 'warning';
            }
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查页面描述
     */
    private async checkDescription() {
        const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        const description = descriptionMeta?.content || '';
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 0;
        let status: 'pass' | 'warning' | 'fail' = 'fail';

        if (!description) {
            issues.push('页面缺少meta description');
            recommendations.push('添加描述性的meta description');
        } else {
            const length = description.length;

            if (length < SEO_THRESHOLDS.description.minLength) {
                issues.push(`描述过短 (${length} 字符)`);
                recommendations.push(`描述长度应至少 ${SEO_THRESHOLDS.description.minLength} 字符`);
            } else if (length > SEO_THRESHOLDS.description.maxLength) {
                issues.push(`描述过长 (${length} 字符)`);
                recommendations.push(`描述长度不应超过 ${SEO_THRESHOLDS.description.maxLength} 字符`);
            }

            if (length >= SEO_THRESHOLDS.description.minLength && length <= SEO_THRESHOLDS.description.maxLength) {
                score = 100;
                status = 'pass';
            } else if (length > 0) {
                score = 50;
                status = 'warning';
            }
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查标题层级
     */
    private async checkHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Elements = document.querySelectorAll('h1');
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 0;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        if (h1Elements.length === 0) {
            issues.push('页面缺少H1标题');
            recommendations.push('添加一个H1标题作为页面主标题');
            status = 'fail';
        } else if (h1Elements.length > 1) {
            issues.push(`页面有多个H1标题 (${h1Elements.length}个)`);
            recommendations.push('一个页面应该只有一个H1标题');
            status = 'warning';
        }

        if (headings.length === 0) {
            issues.push('页面没有任何标题元素');
            recommendations.push('使用标题元素创建清晰的页面结构');
            status = 'fail';
        }

        // 计算得分
        if (status === 'pass') {
            score = 100;
        } else if (status === 'warning') {
            score = 70;
        } else {
            score = 30;
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查图片优化
     */
    private async checkImages() {
        const images = document.querySelectorAll('img');
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 0;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        if (images.length === 0) {
            return {
                status: 'pass' as const,
                score: 100,
                issues: [],
                recommendations: []
            };
        }

        let imagesWithoutAlt = 0;
        let imagesWithPoorAlt = 0;

        images.forEach(img => {
            const alt = img.getAttribute('alt');
            if (!alt) {
                imagesWithoutAlt++;
            } else if (alt.length < SEO_THRESHOLDS.image.minAltLength || alt.length > SEO_THRESHOLDS.image.maxAltLength) {
                imagesWithPoorAlt++;
            }
        });

        if (imagesWithoutAlt > 0) {
            issues.push(`${imagesWithoutAlt} 张图片缺少alt属性`);
            recommendations.push('为所有图片添加描述性的alt属性');
            status = 'warning';
        }

        if (imagesWithPoorAlt > 0) {
            issues.push(`${imagesWithPoorAlt} 张图片的alt属性不够描述性`);
            recommendations.push(`alt属性长度应在 ${SEO_THRESHOLDS.image.minAltLength}-${SEO_THRESHOLDS.image.maxAltLength} 字符之间`);
        }

        // 计算得分
        const totalIssues = imagesWithoutAlt + imagesWithPoorAlt;
        if (totalIssues === 0) {
            score = 100;
        } else if (totalIssues <= images.length * 0.3) {
            score = 80;
            status = 'warning';
        } else {
            score = 40;
            status = 'fail';
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查链接结构
     */
    private async checkLinks() {
        const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href^="' + window.location.origin + '"])');
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 100;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        if (internalLinks.length < SEO_THRESHOLDS.link.minInternalLinks) {
            issues.push(`内部链接数量偏少 (${internalLinks.length}个)`);
            recommendations.push('增加内部链接以改善页面结构和用户体验');
            status = 'warning';
            score = 80;
        }

        if (internalLinks.length > SEO_THRESHOLDS.link.maxInternalLinks) {
            issues.push(`内部链接数量过多 (${internalLinks.length}个)`);
            recommendations.push('减少内部链接数量，保持页面简洁');
            status = 'warning';
            score = 80;
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查Meta标签
     */
    private async checkMetaTags() {
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 100;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        // 检查viewport meta标签
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            issues.push('缺少viewport meta标签');
            recommendations.push('添加viewport meta标签以确保移动端适配');
            status = 'warning';
            score = 80;
        }

        // 检查Open Graph标签
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');

        if (!ogTitle || !ogDescription || !ogImage) {
            issues.push('缺少Open Graph标签');
            recommendations.push('添加Open Graph标签以改善社交媒体分享效果');
            status = 'warning';
            score = 70;
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查结构化数据
     */
    private async checkStructuredData() {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 100;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        if (scripts.length === 0) {
            issues.push('页面没有结构化数据');
            recommendations.push('添加JSON-LD格式的结构化数据以提升搜索引擎理解');
            status = 'warning';
            score = 70;
        }

        // 验证JSON格式
        scripts.forEach(script => {
            try {
                JSON.parse(script.textContent || '');
            } catch (error) {
                issues.push('结构化数据JSON格式无效');
                recommendations.push('修正结构化数据的JSON格式');
                status = 'fail';
                score = 30;
            }
        });

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 检查性能相关SEO因素
     */
    private async checkPerformance() {
        const issues: string[] = [];
        const recommendations: string[] = [];
        let score = 100;
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        // 获取Web Vitals数据（如果可用）
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

            if (loadTime > 3000) {
                issues.push(`页面加载时间过长 (${Math.round(loadTime)}ms)`);
                recommendations.push('优化页面加载速度以提升SEO排名');
                status = 'warning';
                score = 70;
            }
        }

        return {
            status,
            score,
            issues,
            recommendations
        };
    }

    /**
     * 计算SEO等级
     */
    private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * 获取缓存结果
     */
    private getCachedResult(key: string): SEOCheckResult | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.result;
        }
        return null;
    }

    /**
     * 设置缓存结果
     */
    private setCachedResult(key: string, result: SEOCheckResult): void {
        this.cache.set(key, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// 导出单例实例
export const seoScanner = new SEOScanner();

// React Hook将在单独的组件文件中定义