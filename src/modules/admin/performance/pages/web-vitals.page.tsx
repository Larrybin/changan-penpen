/**
 * Web Vitals Performance Monitoring Page
 * Web Vitals性能监控页面
 * 专注于Core Web Vitals指标的详细分析
 */

"use client";

import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Info,
    Target,
    TrendingUp,
    Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebVitalsDashboard } from "@/modules/admin/components/web-vitals-dashboard";

// Web Vitals指标说明
const webVitalsInfo = {
    lcp: {
        name: "Largest Contentful Paint (LCP)",
        description: "最大内容绘制时间 - 衡量主要内容加载速度",
        good: "< 2.5s",
        needsImprovement: "2.5s - 4.0s",
        poor: "> 4.0s",
        icon: <Target className="h-5 w-5" />,
    },
    inp: {
        name: "Interaction to Next Paint (INP)",
        description: "交互到下次绘制时间 - 衡量页面响应性",
        good: "< 200ms",
        needsImprovement: "200ms - 500ms",
        poor: "> 500ms",
        icon: <Zap className="h-5 w-5" />,
    },
    cls: {
        name: "Cumulative Layout Shift (CLS)",
        description: "累积布局偏移 - 衡量视觉稳定性",
        good: "< 0.1",
        needsImprovement: "0.1 - 0.25",
        poor: "> 0.25",
        icon: <Activity className="h-5 w-5" />,
    },
    fcp: {
        name: "First Contentful Paint (FCP)",
        description: "首次内容绘制时间 - 衡量首次内容加载速度",
        good: "< 1.8s",
        needsImprovement: "1.8s - 3.0s",
        poor: "> 3.0s",
        icon: <Clock className="h-5 w-5" />,
    },
    ttfb: {
        name: "Time to First Byte (TTFB)",
        description: "首字节时间 - 衡量服务器响应速度",
        good: "< 800ms",
        needsImprovement: "800ms - 1800ms",
        poor: "> 1800ms",
        icon: <TrendingUp className="h-5 w-5" />,
    },
};

export default function WebVitalsPage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="Web Vitals 性能监控"
                description="监控和分析Core Web Vitals指标，包括LCP、INP、CLS、FCP和TTFB，确保最佳用户体验。"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a
                                href="https://web.dev/vitals/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Web Vitals 指南
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href="https://pagespeed.web.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                PageSpeed 测试
                            </a>
                        </Button>
                        <Button>
                            <Activity className="mr-2 h-4 w-4" />
                            立即测试
                        </Button>
                    </div>
                }
            />

            {/* Web Vitals 说明卡片 */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    <strong>Core Web Vitals</strong>{" "}
                    是Google用来衡量用户体验的三个关键指标：LCP（加载速度）、INP（交互性）和CLS（视觉稳定性）。
                    这些指标直接影响搜索引擎排名和用户满意度。
                </AlertDescription>
            </Alert>

            {/* 指标说明 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(webVitalsInfo).map(([key, info]) => (
                    <Card key={key}>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-base">
                                {info.icon}
                                <span className="ml-2">{info.name}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-muted-foreground text-sm">
                                {info.description}
                            </p>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-green-600">
                                        良好
                                    </span>
                                    <span className="text-green-600">
                                        {info.good}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-yellow-600">
                                        需改进
                                    </span>
                                    <span className="text-yellow-600">
                                        {info.needsImprovement}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-red-600">
                                        差
                                    </span>
                                    <span className="text-red-600">
                                        {info.poor}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 性能监控面板 */}
            <Tabs defaultValue="realtime" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="realtime">实时监控</TabsTrigger>
                    <TabsTrigger value="trends">趋势分析</TabsTrigger>
                    <TabsTrigger value="recommendations">优化建议</TabsTrigger>
                </TabsList>

                <TabsContent value="realtime" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">实时性能监控</h3>
                        <Badge variant="outline">每30秒更新</Badge>
                    </div>
                    <WebVitalsDashboard />
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="mr-2 h-5 w-5" />
                                    性能趋势分析
                                </CardTitle>
                                <CardDescription>
                                    过去7天的性能指标变化趋势
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        {
                                            metric: "LCP",
                                            trend: "improving",
                                            change: "-15%",
                                        },
                                        {
                                            metric: "INP",
                                            trend: "stable",
                                            change: "0%",
                                        },
                                        {
                                            metric: "CLS",
                                            trend: "improving",
                                            change: "-8%",
                                        },
                                        {
                                            metric: "FCP",
                                            trend: "declining",
                                            change: "+12%",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.metric}
                                            className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                        >
                                            <span className="font-medium">
                                                {item.metric}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                {item.trend === "improving" && (
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                )}
                                                {item.trend === "stable" && (
                                                    <Activity className="h-4 w-4 text-blue-600" />
                                                )}
                                                {item.trend === "declining" && (
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                )}
                                                <span
                                                    className={`font-medium text-sm ${
                                                        item.trend ===
                                                        "improving"
                                                            ? "text-green-600"
                                                            : item.trend ===
                                                                "stable"
                                                              ? "text-blue-600"
                                                              : "text-red-600"
                                                    }`}
                                                >
                                                    {item.change}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Target className="mr-2 h-5 w-5" />
                                    性能目标达成情况
                                </CardTitle>
                                <CardDescription>
                                    相对于Google推荐目标的完成度
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        {
                                            metric: "LCP目标",
                                            current: "2.2s",
                                            target: "< 2.5s",
                                            status: "achieved",
                                        },
                                        {
                                            metric: "INP目标",
                                            current: "180ms",
                                            target: "< 200ms",
                                            status: "achieved",
                                        },
                                        {
                                            metric: "CLS目标",
                                            current: "0.08",
                                            target: "< 0.1",
                                            status: "achieved",
                                        },
                                        {
                                            metric: "FCP目标",
                                            current: "1.6s",
                                            target: "< 1.8s",
                                            status: "achieved",
                                        },
                                    ].map((item) => (
                                        <div
                                            key={item.metric}
                                            className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {item.metric}
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    当前: {item.current} | 目标:{" "}
                                                    {item.target}
                                                </div>
                                            </div>
                                            <Badge
                                                variant={
                                                    item.status === "achieved"
                                                        ? "default"
                                                        : "destructive"
                                                }
                                                className="flex items-center space-x-1"
                                            >
                                                {item.status === "achieved" ? (
                                                    <CheckCircle2 className="h-3 w-3" />
                                                ) : (
                                                    <AlertTriangle className="h-3 w-3" />
                                                )}
                                                <span>
                                                    {item.status === "achieved"
                                                        ? "已达成"
                                                        : "未达成"}
                                                </span>
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>性能优化建议</CardTitle>
                                <CardDescription>
                                    基于当前Web Vitals指标的优化建议
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    {
                                        priority: "high",
                                        title: "优化图片加载",
                                        description:
                                            "使用现代图片格式(WebP/AVIF)和响应式图片，实现懒加载",
                                        impact: "LCP, CLS",
                                        effort: "Medium",
                                    },
                                    {
                                        priority: "medium",
                                        title: "减少JavaScript执行时间",
                                        description:
                                            "分割代码包，延迟加载非关键JavaScript",
                                        impact: "INP, FCP",
                                        effort: "High",
                                    },
                                    {
                                        priority: "low",
                                        title: "优化字体加载",
                                        description:
                                            "使用font-display: swap优化字体加载策略",
                                        impact: "FCP, CLS",
                                        effort: "Low",
                                    },
                                ].map((recommendation) => (
                                    <Alert
                                        key={`${recommendation.priority}-${recommendation.title}`}
                                        className={
                                            recommendation.priority === "high"
                                                ? "border-red-200 bg-red-50"
                                                : recommendation.priority ===
                                                    "medium"
                                                  ? "border-yellow-200 bg-yellow-50"
                                                  : "border-blue-200 bg-blue-50"
                                        }
                                    >
                                        <AlertTriangle
                                            className={`h-4 w-4 ${
                                                recommendation.priority ===
                                                "high"
                                                    ? "text-red-600"
                                                    : recommendation.priority ===
                                                        "medium"
                                                      ? "text-yellow-600"
                                                      : "text-blue-600"
                                            }`}
                                        />
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">
                                                        {recommendation.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant="outline">
                                                            {
                                                                recommendation.impact
                                                            }
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {
                                                                recommendation.effort
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground text-sm">
                                                    {recommendation.description}
                                                </p>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
