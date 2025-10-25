/**
 * Performance Monitoring Overview Page
 * 性能监控总览页面
 * 提供全面的性能、SEO和系统健康监控
 */

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SystemPerformanceOverview } from "@/modules/admin/components/system-performance-overview";
import { WebVitalsDashboard } from "@/modules/admin/components/web-vitals-dashboard";
import { SEOTechnicalDashboard } from "@/modules/admin/components/seo-technical-dashboard";
import { PerformanceMonitor } from "@/modules/admin/components/performance-monitor";
import {
    Activity,
    Search,
    Gauge,
    AlertTriangle,
    TrendingUp,
    Settings,
    RefreshCw,
    ExternalLink,
    BarChart3
} from "lucide-react";
import adminRoutes from "@/modules/admin/routes/admin.routes";

export default function PerformanceOverviewPage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="性能监控中心"
                description="全面监控网站性能、SEO指标和系统健康状况，及时识别和解决性能问题。"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a href="https://pagespeed.web.dev" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                PageSpeed Insights
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                                <Search className="h-4 w-4 mr-2" />
                                Search Console
                            </a>
                        </Button>
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            监控设置
                        </Button>
                        <Button>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            刷新数据
                        </Button>
                    </div>
                }
            />

            {/* 快速状态卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">系统健康状态</CardTitle>
                        <Gauge className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">良好</div>
                        <p className="text-xs text-muted-foreground">
                            所有系统运行正常
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">性能评分</CardTitle>
                        <Activity className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">85</div>
                        <p className="text-xs text-muted-foreground">
                            <TrendingUp className="inline h-3 w-3 mr-1" />
                            较上周提升 3%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SEO评分</CardTitle>
                        <Search className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">A</div>
                        <p className="text-xs text-muted-foreground">
                            2个优化建议
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">活跃问题</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">3</div>
                        <p className="text-xs text-muted-foreground">
                            1个警告, 2个建议
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 性能监控内容 */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        总览
                    </TabsTrigger>
                    <TabsTrigger value="web-vitals" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Web Vitals
                    </TabsTrigger>
                    <TabsTrigger value="seo" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        SEO分析
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center gap-2">
                        <Gauge className="h-4 w-4" />
                        系统健康
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">性能概览</h3>
                            <Badge variant="outline">实时监控</Badge>
                        </div>
                        <SystemPerformanceOverview />
                    </div>
                </TabsContent>

                <TabsContent value="web-vitals" className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Web Vitals 性能指标</h3>
                                <p className="text-sm text-muted-foreground">
                                    监控Core Web Vitals指标，包括LCP、INP、CLS、FCP和TTFB
                                </p>
                            </div>
                            <Badge variant="outline">每分钟更新</Badge>
                        </div>
                        <WebVitalsDashboard />
                    </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">SEO技术指标分析</h3>
                                <p className="text-sm text-muted-foreground">
                                    检查SEO元数据、结构化数据和搜索引擎优化状态
                                </p>
                            </div>
                            <Badge variant="outline">实时扫描</Badge>
                        </div>
                        <SEOTechnicalDashboard />
                    </div>
                </TabsContent>

                <TabsContent value="system" className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">系统健康监控</h3>
                                <p className="text-sm text-muted-foreground">
                                    监控数据库连接、缓存状态和API服务健康状况
                                </p>
                            </div>
                            <Badge variant="outline">30秒检查</Badge>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <PerformanceMonitor />
                            <Card>
                                <CardHeader>
                                    <CardTitle>系统健康详情</CardTitle>
                                    <CardDescription>
                                        各系统组件的详细健康状态
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { name: '数据库', status: '正常', response: '45ms' },
                                        { name: '缓存服务', status: '正常', hitRate: '87%' },
                                        { name: 'API服务', status: '正常', response: '120ms' },
                                        { name: '存储服务', status: '正常', available: '1.2TB' },
                                    ].map((service, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="font-medium">{service.name}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {service.response || service.hitRate || service.available}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* 快速操作面板 */}
            <Card>
                <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                    <CardDescription>
                        常用的性能监控和管理操作
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                            <RefreshCw className="h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">刷新缓存</div>
                                <div className="text-xs text-muted-foreground">清理性能监控缓存</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                            <BarChart3 className="h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">导出报告</div>
                                <div className="text-xs text-muted-foreground">下载性能分析报告</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                            <Settings className="h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">监控设置</div>
                                <div className="text-xs text-muted-foreground">配置监控阈值</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                            <AlertTriangle className="h-5 w-5" />
                            <div className="text-left">
                                <div className="font-medium">报警设置</div>
                                <div className="text-xs text-muted-foreground">配置性能报警</div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}