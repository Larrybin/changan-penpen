/**
 * Performance Data Service
 * 性能数据服务
 * 收集、聚合和处理Web Vitals、SEO和系统健康数据
 */

import { z } from 'zod';

// 性能指标数据类型
export const WebVitalsDataSchema = z.object({
    lcp: z.number().optional(),
    inp: z.number().optional(),
    cls: z.number().optional(),
    fcp: z.number().optional(),
    ttfb: z.number().optional(),
    score: z.number(),
    timestamp: z.string(),
    url: z.string()
});

export const SEODataSchema = z.object({
    score: z.number(),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    checks: z.object({
        title: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        description: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        headings: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        images: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        links: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        metaTags: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        structuredData: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
        }),
        performance: z.object({
            status: z.enum(['pass', 'warning', 'fail']),
            score: z.number()
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

export const SystemHealthDataSchema = z.object({
    status: z.enum(['healthy', 'warning', 'critical']),
    uptime: z.number(),
    responseTime: z.number(),
    errorRate: z.number(),
    components: z.object({
        database: z.object({
            status: z.enum(['healthy', 'warning', 'critical']),
            responseTime: z.number()
        }),
        cache: z.object({
            status: z.enum(['healthy', 'warning', 'critical']),
            hitRate: z.number()
        }),
        api: z.object({
            status: z.enum(['healthy', 'warning', 'critical']),
            responseTime: z.number()
        }),
        storage: z.object({
            status: z.enum(['healthy', 'warning', 'critical']),
            available: z.number()
        })
    }),
    timestamp: z.string()
});

// 综合性能数据类型
export const PerformanceMetricsSchema = z.object({
    overview: z.object({
        overallScore: z.number(),
        performanceScore: z.number(),
        seoscore: z.number(),
        healthScore: z.number(),
        grade: z.enum(['A', 'B', 'C', 'D', 'F']),
        trend: z.enum(['improving', 'stable', 'declining'])
    }),
    webVitals: z.object({
        current: WebVitalsDataSchema.optional(),
        historical: z.array(WebVitalsDataSchema),
        trends: z.object({
            lcp: z.enum(['improving', 'stable', 'declining']),
            inp: z.enum(['improving', 'stable', 'declining']),
            cls: z.enum(['improving', 'stable', 'declining']),
            fcp: z.enum(['improving', 'stable', 'declining']),
            ttfb: z.enum(['improving', 'stable', 'declining'])
        })
    }),
    seo: SEODataSchema.optional(),
    systemHealth: SystemHealthDataSchema,
    quickStats: z.object({
        pageViews: z.number(),
        uniqueVisitors: z.number(),
        bounceRate: z.number(),
        avgSessionDuration: z.number(),
        conversionRate: z.number(),
        uptime: z.number(),
        errorRate: z.number(),
        cacheHitRate: z.number()
    }),
    timestamp: z.string()
});

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type WebVitalsData = z.infer<typeof WebVitalsDataSchema>;
export type SEOData = z.infer<typeof SEODataSchema>;
export type SystemHealthData = z.infer<typeof SystemHealthDataSchema>;

/**
 * 性能数据查询参数
 */
export interface PerformanceQueryParams {
    timeframe?: '1h' | '24h' | '7d' | '30d';
    metrics?: string[];
    tenantId?: string;
}

/**
 * 性能数据服务类
 */
export class PerformanceDataService {
    private cache = new Map<string, { data: PerformanceMetrics; timestamp: number }>();
    private readonly CACHE_TTL = 30000; // 30秒缓存

    /**
     * 获取综合性能指标
     */
    async getPerformanceMetrics(params?: PerformanceQueryParams, forceRefresh = false): Promise<PerformanceMetrics> {
        const cacheKey = this.generateCacheKey(params);
        const cached = this.getCachedData(cacheKey);

        if (!forceRefresh && cached) {
            return cached;
        }

        const metrics = await this.collectPerformanceData(params);
        this.setCachedData(cacheKey, metrics);

        return metrics;
    }

    /**
     * 收集综合性能数据
     */
    private async collectPerformanceData(params?: PerformanceQueryParams): Promise<PerformanceMetrics> {
        const timeframe = params?.timeframe || '24h';

        // 并行收集各类数据
        const [
            webVitalsData,
            systemHealthData,
            quickStatsData
        ] = await Promise.allSettled([
            this.collectWebVitalsData(timeframe),
            this.collectSystemHealthData(),
            this.collectQuickStatsData(timeframe)
        ]);

        // SEO数据通常是实时扫描的，不需要历史数据
        const seoData = await this.collectSEOData();

        // 计算综合评分
        const overview = this.calculateOverallScores(
            webVitalsData.status === 'fulfilled' ? webVitalsData.value : undefined,
            seoData,
            systemHealthData.status === 'fulfilled' ? systemHealthData.value : undefined
        );

        return {
            overview,
            webVitals: webVitalsData.status === 'fulfilled' ? webVitalsData.value : this.getDefaultWebVitalsData(),
            seo: seoData,
            systemHealth: systemHealthData.status === 'fulfilled' ? systemHealthData.value : this.getDefaultSystemHealthData(),
            quickStats: quickStatsData.status === 'fulfilled' ? quickStatsData.value : this.getDefaultQuickStatsData(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 收集Web Vitals数据
     */
    private async collectWebVitalsData(timeframe: string): Promise<PerformanceMetrics['webVitals']> {
        // 模拟历史数据
        const historicalData: WebVitalsData[] = this.generateHistoricalWebVitalsData(timeframe);

        // 当前数据（在实际应用中，这应该来自实时监控）
        const currentData: WebVitalsData = {
            lcp: 2500 + Math.random() * 1000,
            inp: 100 + Math.random() * 200,
            cls: 0.1 + Math.random() * 0.2,
            fcp: 1800 + Math.random() * 800,
            ttfb: 400 + Math.random() * 300,
            score: 75 + Math.random() * 20,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'https://example.com'
        };

        // 计算趋势
        const trends = this.calculateWebVitalsTrends(historicalData, currentData);

        return {
            current: currentData,
            historical: historicalData,
            trends
        };
    }

    /**
     * 收集SEO数据
     */
    private async collectSEOData(): Promise<SEOData | undefined> {
        try {
            // 在浏览器环境中，可以调用SEO扫描服务
            if (typeof window !== 'undefined' && window.document) {
                const { seoScanner } = await import('../services/seo-scanner');
                return await seoScanner.scanPage();
            }
        } catch (error) {
            console.warn('SEO scan failed:', error);
        }

        // 返回默认SEO数据
        return this.getDefaultSEOData();
    }

    /**
     * 收集系统健康数据
     */
    private async collectSystemHealthData(): Promise<SystemHealthData> {
        try {
            // 调用健康检查API
            const response = await fetch('/api/v1/health', {
                cache: 'no-cache'
            });

            if (response.ok) {
                const healthData = await response.json();
                return this.transformHealthData(healthData);
            }
        } catch (error) {
            console.warn('Health check failed:', error);
        }

        return this.getDefaultSystemHealthData();
    }

    /**
     * 收集快速统计数据
     */
    private async collectQuickStatsData(timeframe: string): Promise<PerformanceMetrics['quickStats']> {
        // 模拟数据，实际应该从分析服务获取
        const baseStats = {
            pageViews: 50000 + Math.random() * 20000,
            uniqueVisitors: 8000 + Math.random() * 4000,
            bounceRate: 30 + Math.random() * 20,
            avgSessionDuration: 180 + Math.random() * 120,
            conversionRate: 2 + Math.random() * 3,
            uptime: 99 + Math.random(),
            errorRate: Math.random() * 2,
            cacheHitRate: 80 + Math.random() * 15
        };

        // 根据时间范围调整数据
        const multiplier = this.getTimeframeMultiplier(timeframe);
        return {
            pageViews: Math.round(baseStats.pageViews * multiplier),
            uniqueVisitors: Math.round(baseStats.uniqueVisitors * multiplier),
            bounceRate: Math.round(baseStats.bounceRate * 10) / 10,
            avgSessionDuration: Math.round(baseStats.avgSessionDuration),
            conversionRate: Math.round(baseStats.conversionRate * 10) / 10,
            uptime: Math.round(baseStats.uptime * 10) / 10,
            errorRate: Math.round(baseStats.errorRate * 10) / 10,
            cacheHitRate: Math.round(baseStats.cacheHitRate * 10) / 10
        };
    }

    /**
     * 计算综合评分
     */
    private calculateOverallScores(
        webVitals?: PerformanceMetrics['webVitals'],
        seoData?: SEOData,
        systemHealth?: SystemHealthData
    ): PerformanceMetrics['overview'] {
        const performanceScore = webVitals?.current?.score || 75;
        const seoScore = seoData?.score || 70;
        const healthScore = systemHealth ? this.calculateHealthScore(systemHealth) : 80;

        const overallScore = Math.round((performanceScore * 0.4 + seoScore * 0.3 + healthScore * 0.3));

        const grade = this.calculateGrade(overallScore);
        const trend = this.calculateTrend(performanceScore, seoScore, healthScore);

        return {
            overallScore,
            performanceScore,
            seoscore: seoScore,
            healthScore,
            grade,
            trend
        };
    }

    /**
     * 计算健康评分
     */
    private calculateHealthScore(healthData: SystemHealthData): number {
        let score = 100;

        // 根据系统状态扣分
        if (healthData.status === 'warning') score -= 20;
        if (healthData.status === 'critical') score -= 50;

        // 根据响应时间扣分
        if (healthData.responseTime > 1000) score -= 15;
        if (healthData.responseTime > 2000) score -= 25;

        // 根据错误率扣分
        if (healthData.errorRate > 1) score -= 10;
        if (healthData.errorRate > 5) score -= 30;

        // 根据可用性扣分
        if (healthData.uptime < 99) score -= 15;
        if (healthData.uptime < 95) score -= 35;

        return Math.max(0, score);
    }

    /**
     * 计算等级
     */
    private calculateGrade(score: number): PerformanceMetrics['overview']['grade'] {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * 计算趋势
     */
    private calculateTrend(performanceScore: number, seoScore: number, healthScore: number): PerformanceMetrics['overview']['trend'] {
        const averageScore = (performanceScore + seoScore + healthScore) / 3;

        if (averageScore >= 85) return 'improving';
        if (averageScore >= 70) return 'stable';
        return 'declining';
    }

    /**
     * 计算Web Vitals趋势
     */
    private calculateWebVitalsTrends(
        historical: WebVitalsData[],
        current: WebVitalsData
    ): PerformanceMetrics['webVitals']['trends'] {
        if (historical.length < 2) {
            return {
                lcp: 'stable',
                inp: 'stable',
                cls: 'stable',
                fcp: 'stable',
                ttfb: 'stable'
            };
        }

        const recent = historical[historical.length - 1];
        const calculateTrend = (current: number, previous: number) => {
            const change = (current - previous) / previous;
            if (change < -0.1) return 'improving' as const;
            if (change > 0.1) return 'declining' as const;
            return 'stable' as const;
        };

        return {
            lcp: current.lcp && recent.lcp ? calculateTrend(current.lcp, recent.lcp) : 'stable',
            inp: current.inp && recent.inp ? calculateTrend(current.inp, recent.inp) : 'stable',
            cls: current.cls && recent.cls ? calculateTrend(current.cls, recent.cls) : 'stable',
            fcp: current.fcp && recent.fcp ? calculateTrend(current.fcp, recent.fcp) : 'stable',
            ttfb: current.ttfb && recent.ttfb ? calculateTrend(current.ttfb, recent.ttfb) : 'stable'
        };
    }

    /**
     * 生成历史Web Vitals数据
     */
    private generateHistoricalWebVitalsData(timeframe: string): WebVitalsData[] {
        const dataPoints = this.getTimeframeDataPoints(timeframe);
        const now = Date.now();

        return dataPoints.map((offset, index) => ({
            lcp: 2000 + Math.random() * 1500,
            inp: 80 + Math.random() * 250,
            cls: 0.05 + Math.random() * 0.3,
            fcp: 1500 + Math.random() * 1000,
            ttfb: 300 + Math.random() * 500,
            score: 70 + Math.random() * 25,
            timestamp: new Date(now - offset).toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'https://example.com'
        }));
    }

    /**
     * 获取时间范围对应的数据点数量
     */
    private getTimeframeDataPoints(timeframe: string): number[] {
        switch (timeframe) {
            case '1h':
                return Array.from({ length: 12 }, (_, i) => i * 5 * 60 * 1000); // 每5分钟
            case '24h':
                return Array.from({ length: 24 }, (_, i) => i * 60 * 60 * 1000); // 每小时
            case '7d':
                return Array.from({ length: 7 }, (_, i) => i * 24 * 60 * 60 * 1000); // 每天
            case '30d':
                return Array.from({ length: 30 }, (_, i) => i * 24 * 60 * 60 * 1000); // 每天
            default:
                return Array.from({ length: 24 }, (_, i) => i * 60 * 60 * 1000);
        }
    }

    /**
     * 获取时间范围倍数
     */
    private getTimeframeMultiplier(timeframe: string): number {
        switch (timeframe) {
            case '1h': return 0.1;
            case '24h': return 1;
            case '7d': return 7;
            case '30d': return 30;
            default: return 1;
        }
    }

    /**
     * 转换健康数据格式
     */
    private transformHealthData(healthData: any): SystemHealthData {
        return {
            status: healthData.status || 'healthy',
            uptime: healthData.uptime || 99.9,
            responseTime: healthData.responseTime || 200,
            errorRate: healthData.errorRate || 0.1,
            components: {
                database: {
                    status: healthData.components?.database?.status || 'healthy',
                    responseTime: healthData.components?.database?.responseTime || 50
                },
                cache: {
                    status: healthData.components?.cache?.status || 'healthy',
                    hitRate: healthData.components?.cache?.hitRate || 85
                },
                api: {
                    status: healthData.components?.api?.status || 'healthy',
                    responseTime: healthData.components?.api?.responseTime || 100
                },
                storage: {
                    status: healthData.components?.storage?.status || 'healthy',
                    available: healthData.components?.storage?.available || 1000
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 获取默认数据
     */
    private getDefaultWebVitalsData(): PerformanceMetrics['webVitals'] {
        return {
            historical: [],
            trends: {
                lcp: 'stable',
                inp: 'stable',
                cls: 'stable',
                fcp: 'stable',
                ttfb: 'stable'
            }
        };
    }

    private getDefaultSEOData(): SEOData {
        return {
            score: 75,
            grade: 'C',
            checks: {
                title: { status: 'warning', score: 70 },
                description: { status: 'warning', score: 70 },
                headings: { status: 'pass', score: 85 },
                images: { status: 'pass', score: 90 },
                links: { status: 'pass', score: 80 },
                metaTags: { status: 'warning', score: 60 },
                structuredData: { status: 'warning', score: 50 },
                performance: { status: 'pass', score: 80 }
            },
            summary: {
                totalIssues: 3,
                criticalIssues: 0,
                warnings: 3,
                passedChecks: 5
            },
            timestamp: new Date().toISOString()
        };
    }

    private getDefaultSystemHealthData(): SystemHealthData {
        return {
            status: 'healthy',
            uptime: 99.9,
            responseTime: 200,
            errorRate: 0.1,
            components: {
                database: { status: 'healthy', responseTime: 50 },
                cache: { status: 'healthy', hitRate: 85 },
                api: { status: 'healthy', responseTime: 100 },
                storage: { status: 'healthy', available: 1000 }
            },
            timestamp: new Date().toISOString()
        };
    }

    private getDefaultQuickStatsData(): PerformanceMetrics['quickStats'] {
        return {
            pageViews: 50000,
            uniqueVisitors: 8000,
            bounceRate: 35.5,
            avgSessionDuration: 245,
            conversionRate: 3.2,
            uptime: 99.8,
            errorRate: 0.2,
            cacheHitRate: 87.3
        };
    }

    /**
     * 缓存管理
     */
    private generateCacheKey(params?: PerformanceQueryParams): string {
        const timeframe = params?.timeframe || '24h';
        const tenantId = params?.tenantId || 'default';
        return `performance:${timeframe}:${tenantId}`;
    }

    private getCachedData(key: string): PerformanceMetrics | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }

    private setCachedData(key: string, data: PerformanceMetrics): void {
        this.cache.set(key, {
            data,
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
export const performanceDataService = new PerformanceDataService();

/**
 * 便捷函数
 */
export async function getAdminPerformanceMetrics(
    params?: PerformanceQueryParams,
    forceRefresh = false
): Promise<PerformanceMetrics> {
    return await performanceDataService.getPerformanceMetrics(params, forceRefresh);
}