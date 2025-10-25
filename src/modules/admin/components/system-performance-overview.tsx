/**
 * System Performance Overview Dashboard
 * 系统性能概览仪表盘
 * 整合Web Vitals和SEO指标的综合性能监控面板
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Gauge,
    Search,
    Target,
    Zap,
    Eye,
    BarChart3,
    Clock
} from 'lucide-react';
import { WebVitalsDashboard } from './web-vitals-dashboard';
import { SEOTechnicalDashboard } from './seo-technical-dashboard';
import { PerformanceMonitor } from './performance-monitor';
import { cn } from '@/lib/utils';

// 综合性能评分类型
interface SystemPerformanceScore {
    overall: number;
    performance: number;
    seo: number;
    health: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: string;
}

// 快速统计数据类型
interface QuickStats {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
    uptime: number;
    errorRate: number;
    cacheHitRate: number;
}

/**
 * 系统性能评分组件
 */
interface SystemPerformanceScoreProps {
    score: SystemPerformanceScore;
}

function SystemPerformanceScoreCard({ score }: SystemPerformanceScoreProps) {
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-green-600 bg-green-50';
            case 'B': return 'text-blue-600 bg-blue-50';
            case 'C': return 'text-yellow-600 bg-yellow-50';
            case 'D': return 'text-orange-600 bg-orange-50';
            case 'F': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
            case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
            default: return null;
        }
    };

    return (
        <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Gauge className="h-4 w-4 mr-2" />
                    系统综合评分
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-3">
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "text-5xl font-bold",
                            getScoreColor(score.overall)
                        )}>
                            {score.overall}
                        </div>
                        <div className="flex flex-col items-center">
                            <Badge className={getGradeColor(score.grade)}>
                                等级 {score.grade}
                            </Badge>
                            <div className="flex items-center mt-1">
                                {getTrendIcon(score.trend)}
                                <span className="text-xs text-muted-foreground ml-1">
                                    {score.trend === 'improving' ? '改善中' :
                                     score.trend === 'stable' ? '稳定' : '下降中'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Progress value={score.overall} className="w-full" />

                    {/* 分类评分 */}
                    <div className="grid grid-cols-3 gap-2 w-full text-center">
                        <div className="space-y-1">
                            <div className={cn(
                                "text-lg font-semibold",
                                getScoreColor(score.performance)
                            )}>
                                {score.performance}
                            </div>
                            <div className="text-xs text-muted-foreground">性能</div>
                        </div>
                        <div className="space-y-1">
                            <div className={cn(
                                "text-lg font-semibold",
                                getScoreColor(score.seo)
                            )}>
                                {score.seo}
                            </div>
                            <div className="text-xs text-muted-foreground">SEO</div>
                        </div>
                        <div className="space-y-1">
                            <div className={cn(
                                "text-lg font-semibold",
                                getScoreColor(score.health)
                            )}>
                                {score.health}
                            </div>
                            <div className="text-xs text-muted-foreground">健康</div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        更新时间: {new Date(score.lastUpdated).toLocaleString()}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * 快速统计面板组件
 */
interface QuickStatsPanelProps {
    stats: QuickStats;
}

function QuickStatsPanel({ stats }: QuickStatsPanelProps) {
    const statItems = [
        {
            title: '页面浏览量',
            value: stats.pageViews.toLocaleString(),
            icon: <Eye className="h-4 w-4" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: '独立访客',
            value: stats.uniqueVisitors.toLocaleString(),
            icon: <Target className="h-4 w-4" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: '跳出率',
            value: `${stats.bounceRate}%`,
            icon: <Activity className="h-4 w-4" />,
            color: stats.bounceRate > 70 ? 'text-red-600' : 'text-green-600',
            bgColor: stats.bounceRate > 70 ? 'bg-red-50' : 'bg-green-50'
        },
        {
            title: '会话时长',
            value: `${Math.round(stats.avgSessionDuration)}s`,
            icon: <Clock className="h-4 w-4" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            title: '转化率',
            value: `${stats.conversionRate}%`,
            icon: <Zap className="h-4 w-4" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50'
        },
        {
            title: '系统可用性',
            value: `${stats.uptime}%`,
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: stats.uptime >= 99 ? 'text-green-600' : 'text-orange-600',
            bgColor: stats.uptime >= 99 ? 'bg-green-50' : 'bg-orange-50'
        },
        {
            title: '错误率',
            value: `${stats.errorRate}%`,
            icon: <XCircle className="h-4 w-4" />,
            color: stats.errorRate > 5 ? 'text-red-600' : 'text-green-600',
            bgColor: stats.errorRate > 5 ? 'bg-red-50' : 'bg-green-50'
        },
        {
            title: '缓存命中率',
            value: `${stats.cacheHitRate}%`,
            icon: <BarChart3 className="h-4 w-4" />,
            color: stats.cacheHitRate >= 80 ? 'text-green-600' : 'text-yellow-600',
            bgColor: stats.cacheHitRate >= 80 ? 'bg-green-50' : 'bg-yellow-50'
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item, index) => (
                <Card key={index}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            {item.icon}
                            <span className="ml-2">{item.title}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn(
                            "text-2xl font-bold",
                            item.color
                        )}>
                            {item.value}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * 系统健康状态指示器组件
 */
function SystemHealthIndicator() {
    const [healthStatus, setHealthStatus] = useState({
        status: 'healthy' as 'healthy' | 'warning' | 'critical',
        issues: [] as string[],
        checks: {
            database: 'pass' as 'pass' | 'warning' | 'fail',
            cache: 'pass' as 'pass' | 'warning' | 'fail',
            api: 'pass' as 'pass' | 'warning' | 'fail',
            storage: 'pass' as 'pass' | 'warning' | 'fail'
        }
    });

    useEffect(() => {
        // 模拟健康检查
        const checkHealth = async () => {
            try {
                const response = await fetch('/api/v1/health');
                const data = await response.json();

                // 这里应该根据实际健康检查数据更新状态
                setHealthStatus({
                    status: data.status === 'healthy' ? 'healthy' : 'warning',
                    issues: data.issues || [],
                    checks: {
                        database: data.components?.database?.status || 'pass',
                        cache: data.components?.cache?.status || 'pass',
                        api: data.components?.api?.status || 'pass',
                        storage: data.components?.storage?.status || 'pass'
                    }
                });
            } catch (error) {
                setHealthStatus(prev => ({
                    ...prev,
                    status: 'critical',
                    issues: ['无法连接到健康检查服务']
                }));
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // 30秒检查一次
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-600 bg-green-50';
            case 'warning': return 'text-yellow-600 bg-yellow-50';
            case 'critical': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center">
                    {getStatusIcon(healthStatus.status)}
                    <span className="ml-2">系统健康状态</span>
                    <Badge className={cn("ml-auto", getStatusColor(healthStatus.status))}>
                        {healthStatus.status === 'healthy' ? '正常' :
                         healthStatus.status === 'warning' ? '警告' : '严重'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(healthStatus.checks).map(([service, status]) => (
                        <div key={service} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-muted-foreground">{service}</span>
                            <Badge variant={status === 'pass' ? 'default' : 'destructive'}>
                                {status === 'pass' ? '正常' : '异常'}
                            </Badge>
                        </div>
                    ))}
                </div>

                {healthStatus.issues.length > 0 && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1">
                                {healthStatus.issues.map((issue, index) => (
                                    <div key={index} className="text-sm">{issue}</div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * 系统性能概览仪表盘主组件
 */
export function SystemPerformanceOverview() {
    const [performanceScore, setPerformanceScore] = useState<SystemPerformanceScore | null>(null);
    const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // 计算综合性能评分
    const calculateOverallScore = useCallback(() => {
        // 模拟数据，实际应该从Web Vitals和SEO检查结果计算
        const score: SystemPerformanceScore = {
            overall: 85,
            performance: 82,
            seo: 88,
            health: 90,
            grade: 'B',
            trend: 'improving',
            lastUpdated: new Date().toISOString()
        };
        setPerformanceScore(score);
    }, []);

    // 加载快速统计数据
    const loadQuickStats = useCallback(() => {
        // 模拟数据，实际应该从分析API获取
        const stats: QuickStats = {
            pageViews: 45678,
            uniqueVisitors: 8934,
            bounceRate: 32.5,
            avgSessionDuration: 245,
            conversionRate: 3.2,
            uptime: 99.8,
            errorRate: 0.2,
            cacheHitRate: 87.3
        };
        setQuickStats(stats);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                calculateOverallScore();
                loadQuickStats();
            } catch (error) {
                console.error('Failed to load performance data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // 设置定时刷新
        const interval = setInterval(() => {
            calculateOverallScore();
            loadQuickStats();
        }, 60000); // 1分钟刷新一次

        return () => clearInterval(interval);
    }, [calculateOverallScore, loadQuickStats]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">系统性能概览</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-4">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Card key={i}>
                            <CardContent className="flex items-center justify-center py-12">
                                <Gauge className="h-8 w-8 animate-pulse text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">系统性能概览</h2>
                    <p className="text-muted-foreground">
                        综合监控Web Vitals、SEO指标和系统健康状态
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新数据
                </Button>
            </div>

            {/* 标签页导航 */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">总览</TabsTrigger>
                    <TabsTrigger value="performance">性能监控</TabsTrigger>
                    <TabsTrigger value="seo">SEO分析</TabsTrigger>
                    <TabsTrigger value="health">系统健康</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* 综合评分和快速统计 */}
                    <div className="grid gap-6 lg:grid-cols-4">
                        {performanceScore && <SystemPerformanceScoreCard score={performanceScore} />}

                        {/* 系统健康状态 */}
                        <div className="lg:col-span-3">
                            <SystemHealthIndicator />
                        </div>
                    </div>

                    {/* 快速统计 */}
                    {quickStats && <QuickStatsPanel stats={quickStats} />}

                    {/* 快速导航卡片 */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setActiveTab('performance')}>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                                    性能监控
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    查看Web Vitals指标、性能趋势和系统响应时间分析
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setActiveTab('seo')}>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Search className="h-5 w-5 mr-2 text-green-600" />
                                    SEO分析
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    检查SEO技术指标、元数据优化和搜索引擎友好度
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setActiveTab('health')}>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Gauge className="h-5 w-5 mr-2 text-purple-600" />
                                    系统健康
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    监控数据库连接、缓存状态和API服务健康状况
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance">
                    <WebVitalsDashboard />
                </TabsContent>

                <TabsContent value="seo">
                    <SEOTechnicalDashboard />
                </TabsContent>

                <TabsContent value="health">
                    <div className="space-y-6">
                        <PerformanceMonitor />
                        <SystemHealthIndicator />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SystemPerformanceOverview;