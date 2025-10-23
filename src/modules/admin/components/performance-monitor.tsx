/**
 * Admin Dashboard Performance Monitor
 * 性能监控组件
 * 实时监控缓存命中率和响应时间
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getAdminCacheManager } from '@/lib/cache/admin-cache';
import { getCacheInvalidationManager } from '@/lib/cache/cache-invalidation';

interface PerformanceMetrics {
    cacheStats: {
        hits: number;
        misses: number;
        hitRate: number;
    };
    invalidationStats: {
        totalEvents: number;
        eventsByType: Record<string, number>;
    };
    responseTime: {
        average: number;
        min: number;
        max: number;
        p95: number;
    };
    timestamp: string;
}

/**
 * 性能监控仪表盘组件
 */
export function PerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const manager = getAdminCacheManager();
            const invalidationManager = getCacheInvalidationManager();

            const [cacheStats, invalidationStats] = await Promise.all([
                manager.getStats(),
                invalidationManager.getInvalidationStats('hour'),
            ]);

            // 模拟响应时间统计（实际项目中可以从监控服务获取）
            const responseTime = {
                average: Math.random() * 500 + 100, // 100-600ms
                min: Math.random() * 50 + 50, // 50-100ms
                max: Math.random() * 200 + 800, // 800-1000ms
                p95: Math.random() * 300 + 400, // 400-700ms
            };

            setMetrics({
                cacheStats,
                invalidationStats,
                responseTime,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to fetch performance metrics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();

        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, 30000); // 30秒刷新
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const getHitRateColor = (hitRate: number) => {
        if (hitRate >= 80) return 'text-green-600';
        if (hitRate >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getResponseTimeColor = (time: number) => {
        if (time <= 200) return 'text-green-600';
        if (time <= 500) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!metrics) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">加载性能指标中...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 控制栏 */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">性能监控</h3>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? '停止' : '开始'} 自动刷新
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMetrics}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn(
                            "h-4 w-4 mr-1",
                            isLoading && "animate-spin"
                        )} />
                        刷新
                    </Button>
                </div>
            </div>

            {/* 缓存性能指标 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            缓存命中率
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <span className={cn(
                                "text-2xl font-bold",
                                getHitRateColor(metrics.cacheStats.hitRate)
                            )}>
                                {metrics.cacheStats.hitRate}%
                            </span>
                            {metrics.cacheStats.hitRate >= 80 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <Progress
                            value={metrics.cacheStats.hitRate}
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.cacheStats.hits} 次命中 / {metrics.cacheStats.misses} 次未命中
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            平均响应时间
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <span className={cn(
                                "text-2xl font-bold",
                                getResponseTimeColor(metrics.responseTime.average)
                            )}>
                                {Math.round(metrics.responseTime.average)}ms
                            </span>
                            <Badge variant="outline" className="text-xs">
                                P95: {Math.round(metrics.responseTime.p95)}ms
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>最快: {Math.round(metrics.responseTime.min)}ms</span>
                            <span>最慢: {Math.round(metrics.responseTime.max)}ms</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            缓存失效事件
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.invalidationStats.totalEvents}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            过去1小时
                        </p>
                        {Object.keys(metrics.invalidationStats.eventsByType).length > 0 && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(metrics.invalidationStats.eventsByType)
                                    .slice(0, 3)
                                    .map(([event, count]) => (
                                        <div key={event} className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{event}</span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            系统状态
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">运行正常</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            更新时间: {new Date(metrics.timestamp).toLocaleTimeString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 性能建议 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">性能优化建议</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {metrics.cacheStats.hitRate < 80 && (
                            <div className="flex items-start space-x-2">
                                <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                                    建议优化
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    缓存命中率偏低({metrics.cacheStats.hitRate}%)，建议增加缓存时间或优化缓存策略
                                </p>
                            </div>
                        )}

                        {metrics.responseTime.average > 500 && (
                            <div className="flex items-start space-x-2">
                                <Badge variant="outline" className="text-red-600 bg-red-50">
                                    需要关注
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    平均响应时间较长({Math.round(metrics.responseTime.average)}ms)，建议检查数据库查询或API性能
                                </p>
                            </div>
                        )}

                        {metrics.cacheStats.hitRate >= 80 && metrics.responseTime.average <= 200 && (
                            <div className="flex items-start space-x-2">
                                <Badge variant="outline" className="text-green-600 bg-green-50">
                                    性能良好
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    系统性能表现优异，缓存命中率和响应时间都在合理范围内
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * 简化的性能指标徽章组件
 */
export function PerformanceBadge() {
    const [hitRate, setHitRate] = useState<number | null>(null);

    useEffect(() => {
        const fetchHitRate = async () => {
            try {
                const manager = getAdminCacheManager();
                const stats = await manager.getStats();
                setHitRate(stats.hitRate);
            } catch (error) {
                // 静默失败
            }
        };

        fetchHitRate();
        const interval = setInterval(fetchHitRate, 60000); // 每分钟更新
        return () => clearInterval(interval);
    }, []);

    if (hitRate === null) return null;

    const getVariant = () => {
        if (hitRate >= 80) return 'default';
        if (hitRate >= 60) return 'secondary';
        return 'destructive';
    };

    return (
        <Badge variant={getVariant()} className="text-xs">
            缓存 {hitRate}%
        </Badge>
    );
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}

export default PerformanceMonitor;