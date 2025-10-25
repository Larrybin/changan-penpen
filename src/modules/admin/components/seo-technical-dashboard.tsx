/**
 * SEO Technical Dashboard
 * SEO技术指标仪表盘
 * 展示SEO健康状况评分和详细技术指标
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    TrendingUp,
    RefreshCw,
    Shield,
    Target,
    Zap
} from 'lucide-react';
import { seoScanner, type SEOCheckResult, SEO_THRESHOLDS } from '../services/seo-scanner';
import { cn } from '@/lib/utils';

/**
 * SEO评分概览组件
 */
interface SEOScoreOverviewProps {
    result: SEOCheckResult;
}

function SEOScoreOverview({ result }: SEOScoreOverviewProps) {
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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 总体评分 */}
            <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        SEO总体评分
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center space-y-2">
                        <div className={cn(
                            "text-4xl font-bold",
                            getScoreColor(result.score)
                        )}>
                            {result.score}
                        </div>
                        <Badge className={getGradeColor(result.grade)}>
                            等级 {result.grade}
                        </Badge>
                        <Progress value={result.score} className="w-full mt-2" />
                    </div>
                </CardContent>
            </Card>

            {/* 通过检查 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        通过检查
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {result.summary.passedChecks}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        项检查通过
                    </p>
                </CardContent>
            </Card>

            {/* 警告数量 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                        警告问题
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                        {result.summary.warnings}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        个需要优化
                    </p>
                </CardContent>
            </Card>

            {/* 严重问题 */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                        严重问题
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                        {result.summary.criticalIssues}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        个急需修复
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * SEO检查项详情组件
 */
interface SEOCheckItemProps {
    title: string;
    check: SEOCheckResult['checks'][keyof SEOCheckResult['checks']];
    icon: React.ReactNode;
}

function SEOCheckItem({ title, check, icon }: SEOCheckItemProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass': return 'text-green-600 bg-green-50 border-green-200';
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'fail': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
            default: return null;
        }
    };

    return (
        <Card className={cn("border", getStatusColor(check.status))}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center">
                        {icon}
                        <span className="ml-2">{title}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                        {getStatusIcon(check.status)}
                        <span className="text-sm font-medium">{check.score}%</span>
                    </div>
                </div>
                <Progress value={check.score} className="mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
                {/* 问题列表 */}
                {check.issues.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-600">发现问题</h4>
                        <ul className="text-sm space-y-1">
                            {check.issues.map((issue, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                                    <span className="text-muted-foreground">{issue}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 优化建议 */}
                {check.recommendations.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-blue-600">优化建议</h4>
                        <ul className="text-sm space-y-1">
                            {check.recommendations.map((recommendation, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                                    <span className="text-muted-foreground">{recommendation}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * SEO优化建议汇总组件
 */
interface SEOOptimizationTipsProps {
    result: SEOCheckResult;
}

function SEOOptimizationTips({ result }: SEOOptimizationTipsProps) {
    const allRecommendations = Object.values(result.checks)
        .flatMap(check => check.recommendations);

    const priorityRecommendations = allRecommendations.slice(0, 5);

    if (allRecommendations.length === 0) {
        return (
            <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                    太棒了！您的页面SEO已经优化得很好，暂无特别需要改进的地方。
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">SEO优化建议</h3>
                <Badge variant="outline">
                    {allRecommendations.length} 项建议
                </Badge>
            </div>

            <div className="grid gap-3">
                {priorityRecommendations.map((recommendation, index) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm">
                            {recommendation}
                        </AlertDescription>
                    </Alert>
                ))}
            </div>

            {allRecommendations.length > 5 && (
                <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">
                        还有 {allRecommendations.length - 5} 项优化建议...
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * SEO技术指标仪表盘主组件
 */
export function SEOTechnicalDashboard() {
    const [result, setResult] = useState<SEOCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

    const performScan = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const scanResult = await seoScanner.scanPage();
            setResult(scanResult);
            setLastScanTime(new Date());
        } catch (err) {
            setError(err instanceof Error ? err : new Error('SEO扫描失败'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        performScan();
    }, [performScan]);

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <XCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                        SEO扫描失败
                    </h3>
                    <p className="text-muted-foreground mb-4 text-center max-w-md">
                        {error.message}
                    </p>
                    <Button onClick={performScan} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试扫描
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!result) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                        <Search className="h-8 w-8 animate-pulse mx-auto text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">
                                {isLoading ? '正在执行SEO扫描...' : '准备开始SEO扫描'}
                            </p>
                        </div>
                        {isLoading && (
                            <div className="w-64 bg-secondary rounded-full h-2 mx-auto">
                                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 控制栏 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">SEO技术指标</h2>
                    <p className="text-muted-foreground">
                        {lastScanTime && `最后扫描时间: ${lastScanTime.toLocaleString()}`}
                    </p>
                </div>
                <Button
                    onClick={performScan}
                    disabled={isLoading}
                    variant="outline"
                >
                    <RefreshCw className={cn(
                        "h-4 w-4 mr-2",
                        isLoading && "animate-spin"
                    )} />
                    重新扫描
                </Button>
            </div>

            {/* SEO评分概览 */}
            <SEOScoreOverview result={result} />

            {/* 详细检查结果 */}
            <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="details">详细检查</TabsTrigger>
                    <TabsTrigger value="recommendations">优化建议</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <SEOCheckItem
                            title="页面标题"
                            check={result.checks.title}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="页面描述"
                            check={result.checks.description}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="标题层级"
                            check={result.checks.headings}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="图片优化"
                            check={result.checks.images}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="链接结构"
                            check={result.checks.links}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="Meta标签"
                            check={result.checks.metaTags}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="结构化数据"
                            check={result.checks.structuredData}
                            icon={<Target className="h-5 w-5" />}
                        />
                        <SEOCheckItem
                            title="性能因素"
                            check={result.checks.performance}
                            icon={<Target className="h-5 w-5" />}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="recommendations">
                    <SEOOptimizationTips result={result} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SEOTechnicalDashboard;