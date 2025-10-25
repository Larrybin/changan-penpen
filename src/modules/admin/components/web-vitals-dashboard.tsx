/**
 * Admin Web Vitals Dashboard
 * Web Vitals性能指标监控仪表盘
 * 集成现有WebVitals组件数据，为Admin用户提供性能监控功能
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Web Vitals数据类型
interface WebVitalData {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    timestamp: number;
}

interface PerformanceTrend {
    timestamp: number;
    lcp?: number;
    inp?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
}

interface PerformanceSummary {
    score: number;
    metrics: {
        lcp: WebVitalData | null;
        inp: WebVitalData | null;
        cls: WebVitalData | null;
        fcp: WebVitalData | null;
        ttfb: WebVitalData | null;
    };
    trends: PerformanceTrend[];
    lastUpdated: string;
}

// Web Vitals阈值配置
const WEB_VITALS_THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    INP: { good: 200, needsImprovement: 500 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 }
} as const;

/**
 * Web Vitals指标卡片组件
 */
function VitalCard({
    vital,
    title,
    description,
    showTrend = false,
    trend
}: {
    vital: WebVitalData | null;
    title: string;
    description: string;
    showTrend?: boolean;
    trend?: 'up' | 'down' | 'stable';
}) {
    if (!vital) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-16">
                        <div className="text-center">
                            <div className="text-2xl mb-1">--</div>
                            <div className="text-xs text-muted-foreground">等待数据</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const threshold = WEB_VITALS_THRESHOLDS[vital.name as keyof typeof WEB_VITALS_THRESHOLDS];
    const percentage = calculatePercentage(vital.value, threshold);
    const isGood = vital.rating === 'good';
    const isPoor = vital.rating === 'poor';

    return (
        <Card className={cn(
            "relative overflow-hidden",
            isPoor && "border-red-200 bg-red-50/50"
        )}>
            {/* 状态指示器 */}
            <div className={cn(
                "absolute top-0 right-0 w-1 h-full",
                isGood && "bg-green-500",
                !isGood && !isPoor && "bg-yellow-500",
                isPoor && "bg-red-500"
            )} />

            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                        {title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {showTrend && trend && (
                            <Badge
                                variant={trend === 'up' ? 'default' : 'destructive'}
                                className="text-xs"
                            >
                                {trend === 'up' ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : trend === 'down' ? (
                                    <TrendingDown className="h-3 w-3" />
                                ) : (
                                    <Activity className="h-3 w-3" />
                                )}
                            </Badge>
                        )}
                        <Badge
                            variant={isGood ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            {vital.rating === 'good' ? '优秀' :
                             vital.rating === 'needs-improvement' ? '需改进' : '差'}
                        </Badge>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    {/* 当前值 */}
                    <div className="flex items-baseline justify-between">
                        <div>
                            <span className={cn(
                                "text-2xl font-bold",
                                isGood && "text-green-600",
                                !isGood && !isPoor && "text-yellow-600",
                                isPoor && "text-red-600"
                            )}>
                                {formatValue(vital.name, vital.value)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                                ({percentage}%)
                            </span>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-xs"
                        >
                            {vital.rating === 'good' ? `≤${formatThreshold(vital.name, threshold.good)}` :
                             vital.rating === 'needs-improvement' ? `≤${formatThreshold(vital.name, threshold.needsImprovement)}` :
                             `>${formatThreshold(vital.name, threshold.needsImprovement)}`}
                        </Badge>
                    </div>

                    {/* 进度条 */}
                    <Progress
                        value={percentage}
                        className="h-2"
                    />

                    {/* 额外信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Delta: {formatValue(vital.name, vital.delta)}</span>
                        <span>{new Date(vital.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 性能趋势图表组件
 */
function PerformanceTrendChart({ trends }: { trends: PerformanceTrend[] }) {
    if (trends.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">性能趋势</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <Clock className="h-6 w-6 mr-2" />
                        <span>暂无趋势数据</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 计算最近7天的平均性能
    const recentData = trends.slice(-7);
    const avgLcp = recentData.reduce((sum, d) => sum + (d.lcp || 0), 0) / recentData.length;
    const avgCLS = recentData.reduce((sum, d) => sum + (d.cls || 0), 0) / recentData.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">性能趋势（7天平均）</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">LCP</span>
                            <span className="text-sm font-medium">
                                {formatValue('LCP', avgLcp)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">CLS</span>
                            <span className="text-sm font-medium">
                                {formatValue('CLS', avgCLS)}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                            最近更新: {new Date(recentData[recentData.length - 1]?.timestamp || Date.now()).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            数据点: {trends.length} 个
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 性能评分总览组件
 */
function PerformanceScoreOverview({ summary }: { summary: PerformanceSummary }) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 90) return <CheckCircle className="h-8 w-8 text-green-500" />;
        if (score >= 70) return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    性能总评
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            {getScoreIcon(summary.score)}
                            <div>
                                <div className={cn("text-3xl font-bold", getScoreColor(summary.score))}>
                                    {summary.score}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    性能评分
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold mb-1">
                            {summary.metrics.filter(m => m !== null).length}/5
                        </div>
                        <div className="text-xs text-muted-foreground">
                            监控指标
                        </div>
                    </div>
                </div>

                <Separator className="my-4" />

                {/* 核心指标状态 */}
                <div className="grid grid-cols-5 gap-2 text-center">
                    {(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const).map(metric => {
                    const vital = summary.metrics[metric];
                    const isGood = vital?.rating === 'good';

                    return (
                        <div key={metric} className="space-y-1">
                            <div className="text-xs font-medium">{metric}</div>
                            <div className={cn(
                                "w-2 h-2 rounded-full mx-auto",
                                isGood ? "bg-green-500" : "bg-red-500"
                            )} />
                        </div>
                    );
                })}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 主要的Web Vitals仪表盘组件
 */
export function WebVitalsDashboard() {
    const [summary, setSummary] = useState<PerformanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30000); // 30秒

    // 模拟数据获取 - 实际项目中应该从API获取
    const fetchPerformanceData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 这里应该调用性能数据API
            // const response = await fetch('/api/v1/admin/performance/web-vitals');
            // const data = await response.json();

            // 模拟数据生成
            const mockData: PerformanceSummary = {
                score: 85,
                metrics: {
                    lcp: {
                        name: 'LCP',
                        value: 2100,
                        rating: 'good',
                        delta: 50,
                        timestamp: Date.now()
                    },
                    inp: {
                        name: 'INP',
                        value: 150,
                        rating: 'good',
                        delta: -10,
                        timestamp: Date.now()
                    },
                    cls: {
                        name: 'CLS',
                        value: 0.08,
                        rating: 'good',
                        delta: 0.02,
                        timestamp: Date.now()
                    },
                    fcp: {
                        name: 'FCP',
                        value: 1600,
                        rating: 'good',
                        delta: 30,
                        timestamp: Date.now()
                    },
                    ttfb: {
                        name: 'TTFB',
                        value: 600,
                        rating: 'good',
                        delta: -50,
                        timestamp: Date.now()
                    }
                },
                trends: generateMockTrends(),
                lastUpdated: new Date().toISOString()
            };

            setSummary(mockData);
        } catch (error) {
            console.error('Failed to fetch performance data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 生成模拟趋势数据
    const generateMockTrends = (): PerformanceTrend[] => {
        const trends: PerformanceTrend[] = [];
        const now = Date.now();

        for (let i = 29; i >= 0; i--) {
            const timestamp = now - (i * 24 * 60 * 60 * 1000); // 每天
            trends.push({
                timestamp,
                lcp: 2000 + Math.random() * 1000,
                inp: 150 + Math.random() * 100,
                cls: 0.05 + Math.random() * 0.1,
                fcp: 1500 + Math.random() * 500,
                ttfb: 500 + Math.random() * 300
            });
        }

        return trends;
    };

    // 计算趋势方向
    const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
        const diff = current - previous;
        const threshold = previous * 0.05; // 5%变化阈值

        if (Math.abs(diff) < threshold) return 'stable';
        return diff > 0 ? 'down' : 'up'; // 性能指标，数值越小越好
    };

    // 初始数据加载
    useEffect(() => {
        fetchPerformanceData();
    }, []);

    // 自动刷新
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchPerformanceData();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval]);

    if (isLoading && !summary) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                        <Activity className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">加载性能数据中...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                        <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">无法加载性能数据</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchPerformanceData}
                        >
                            重试
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 控制栏 */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Web Vitals 监控</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? '停止自动刷新' : '开始自动刷新'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPerformanceData}
                    >
                        刷新数据
                    </Button>
                </div>
            </div>

            {/* 性能总览 */}
            <PerformanceScoreOverview summary={summary} />

            {/* 核心指标 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <VitalCard
                    vital={summary.metrics.lcp}
                    title="LCP"
                    description="最大内容绘制时间"
                    showTrend={true}
                    trend={summary.trends.length > 1 ?
                        calculateTrend(
                            summary.metrics.lcp?.value || 0,
                            summary.trends[summary.trends.length - 2]?.lcp || 0
                        ) : undefined
                    }
                />
                <VitalCard
                    vital={summary.metrics.inp}
                    title="INP"
                    description="首次输入延迟"
                    showTrend={true}
                    trend={summary.trends.length > 1 ?
                        calculateTrend(
                            summary.metrics.inp?.value || 0,
                            summary.trends[summary.trends.length - 2]?.inp || 0
                        ) : undefined
                    }
                />
                <VitalCard
                    vital={summary.metrics.cls}
                    title="CLS"
                    description="累积布局偏移"
                    showTrend={true}
                    trend={summary.trends.length > 1 ?
                        calculateTrend(
                            summary.metrics.cls?.value || 0,
                            summary.trends[summary.trends.length - 2]?.cls || 0
                        ) : undefined
                    }
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <VitalCard
                    vital={summary.metrics.fcp}
                    title="FCP"
                    description="首次内容绘制"
                    showTrend={false}
                />
                <VitalCard
                    vital={summary.metrics.ttfb}
                    title="TTFB"
                    description="首字节时间"
                    showTrend={false}
                />
            </div>

            {/* 趋势分析 */}
            <PerformanceTrendChart trends={summary.trends} />

            {/* 更新时间 */}
            <div className="text-center text-xs text-muted-foreground">
                最后更新: {new Date(summary.lastUpdated).toLocaleString()}
                {autoRefresh && ` (自动刷新: ${refreshInterval / 1000}秒)`}
            </div>
        </div>
    );
}

// 工具函数
function formatValue(name: string, value: number): string {
    switch (name) {
        case 'LCP':
        case 'INP':
        case 'FCP':
        case 'TTFB':
            return `${Math.round(value)}ms`;
        case 'CLS':
            return value.toFixed(4);
        default:
            return value.toFixed(2);
    }
}

function formatThreshold(name: string, value: number): string {
    switch (name) {
        case 'LCP':
        case 'INP':
        case 'FCP':
        case 'TTFB':
            return `${value}ms`;
        case 'CLS':
            return String(value);
        default:
            return String(value);
    }
}

function calculatePercentage(value: number, threshold: { good: number; needsImprovement: number }): number {
    if (value <= threshold.good) return 100;
    if (value <= threshold.needsImprovement) {
        return Math.round(((threshold.needsImprovement - value) / (threshold.needsImprovement - threshold.good)) * 50) + 50;
    }
    return 0;
}

export default WebVitalsDashboard;