/**
 * SEO Analysis Page
 * SEO分析页面
 * 专注于SEO技术指标的详细分析和优化建议
 */

"use client";

import {
    AlertTriangle,
    CheckCircle2,
    Code,
    ExternalLink,
    FileText,
    Image,
    Link,
    RefreshCw,
    Search,
    Settings,
    Target,
    XCircle,
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOTechnicalDashboard } from "@/modules/admin/components/seo-technical-dashboard";

// SEO检查类别
const seoCategories = [
    {
        id: "content",
        name: "内容优化",
        description: "页面标题、描述和内容质量",
        icon: <FileText className="h-5 w-5" />,
        color: "text-blue-600 bg-blue-50",
    },
    {
        id: "technical",
        name: "技术SEO",
        description: "Meta标签、结构化数据和URL结构",
        icon: <Code className="h-5 w-5" />,
        color: "text-green-600 bg-green-50",
    },
    {
        id: "media",
        name: "媒体优化",
        description: "图片Alt属性和文件优化",
        icon: <Image className="h-5 w-5" />,
        color: "text-purple-600 bg-purple-50",
    },
    {
        id: "links",
        name: "链接结构",
        description: "内部链接和锚文本优化",
        icon: <Link className="h-5 w-5" />,
        color: "text-orange-600 bg-orange-50",
    },
    {
        id: "performance",
        name: "性能因素",
        description: "页面加载速度和Core Web Vitals",
        icon: <Target className="h-5 w-5" />,
        color: "text-red-600 bg-red-50",
    },
];

export default function SEOPage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="SEO技术分析"
                description="全面分析网站SEO技术指标，包括Meta标签、结构化数据、内容优化和性能因素，提升搜索引擎排名。"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a
                                href="https://search.google.com/search-console"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Search Console
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href="https://schema.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Schema.org
                            </a>
                        </Button>
                        <Button>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            重新扫描
                        </Button>
                    </div>
                }
            />

            {/* SEO总览 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                            <Search className="mr-2 h-4 w-4" />
                            SEO总分
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="font-bold text-4xl text-green-600">
                                A
                            </div>
                            <Badge className="bg-green-50 text-green-600">
                                优秀
                            </Badge>
                            <Progress value={88} className="mt-2 w-full" />
                        </div>
                    </CardContent>
                </Card>

                {seoCategories.map((category, _index) => (
                    <Card key={category.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center font-medium text-muted-foreground text-sm">
                                {category.icon}
                                <span className="ml-2">{category.name}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center space-y-2">
                                <div className="font-bold text-2xl">
                                    {85 + Math.floor(Math.random() * 15)}
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    <span className="text-green-600 text-xs">
                                        良好
                                    </span>
                                </div>
                                <Progress
                                    value={85 + Math.floor(Math.random() * 15)}
                                    className="mt-2 w-full"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* SEO分析面板 */}
            <Tabs defaultValue="scan" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="scan">SEO扫描</TabsTrigger>
                    <TabsTrigger value="issues">问题分析</TabsTrigger>
                    <TabsTrigger value="recommendations">优化建议</TabsTrigger>
                    <TabsTrigger value="tools">SEO工具</TabsTrigger>
                </TabsList>

                <TabsContent value="scan" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">实时SEO扫描</h3>
                        <Badge variant="outline">实时检测</Badge>
                    </div>
                    <SEOTechnicalDashboard />
                </TabsContent>

                <TabsContent value="issues" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <XCircle className="mr-2 h-5 w-5 text-red-600" />
                                    严重问题
                                </CardTitle>
                                <CardDescription>
                                    需要立即修复的SEO问题
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    {
                                        title: "缺少Meta描述",
                                        url: "/home",
                                        impact: "高",
                                        description: "首页缺少Meta描述标签",
                                    },
                                ].map((issue) => (
                                    <Alert
                                        key={`${issue.url}-${issue.title}`}
                                        className="border-red-200 bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <AlertDescription>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {issue.title}
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    {issue.url} -{" "}
                                                    {issue.description}
                                                </div>
                                                <Badge
                                                    variant="destructive"
                                                    className="mt-1"
                                                >
                                                    影响程度: {issue.impact}
                                                </Badge>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                                    警告问题
                                </CardTitle>
                                <CardDescription>
                                    建议优化的SEO问题
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    {
                                        title: "标题长度偏短",
                                        url: "/about",
                                        impact: "中",
                                        description:
                                            "标题长度建议在30-60字符之间",
                                    },
                                    {
                                        title: "缺少Open Graph标签",
                                        url: "/products",
                                        impact: "中",
                                        description:
                                            "添加og:title和og:description标签",
                                    },
                                ].map((issue) => (
                                    <Alert
                                        key={`${issue.url}-${issue.title}`}
                                        className="border-yellow-200 bg-yellow-50"
                                    >
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription>
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {issue.title}
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    {issue.url} -{" "}
                                                    {issue.description}
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-1"
                                                >
                                                    影响程度: {issue.impact}
                                                </Badge>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO优化优先级</CardTitle>
                                <CardDescription>
                                    按影响程度和实施难度排序的优化建议
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    {
                                        priority: 1,
                                        title: "完善Meta标签",
                                        description:
                                            "为所有页面添加完整的Meta描述和关键词标签",
                                        impact: "高",
                                        effort: "低",
                                        timeframe: "1-2天",
                                    },
                                    {
                                        priority: 2,
                                        title: "优化标题结构",
                                        description:
                                            "确保每个页面只有一个H1标签，标题层次清晰",
                                        impact: "高",
                                        effort: "中",
                                        timeframe: "3-5天",
                                    },
                                    {
                                        priority: 3,
                                        title: "添加结构化数据",
                                        description:
                                            "为产品页面添加Product schema，为文章添加Article schema",
                                        impact: "中",
                                        effort: "高",
                                        timeframe: "1-2周",
                                    },
                                ].map((rec) => (
                                    <div
                                        key={`${rec.priority}-${rec.title}`}
                                        className="flex items-start space-x-4 rounded-lg border p-4"
                                    >
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                                            {rec.priority}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h4 className="font-semibold">
                                                {rec.title}
                                            </h4>
                                            <p className="text-muted-foreground text-sm">
                                                {rec.description}
                                            </p>
                                            <div className="flex items-center space-x-4">
                                                <Badge variant="outline">
                                                    影响: {rec.impact}
                                                </Badge>
                                                <Badge variant="outline">
                                                    工作量: {rec.effort}
                                                </Badge>
                                                <Badge variant="outline">
                                                    时间: {rec.timeframe}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                name: "Google Search Console",
                                description: "监控网站搜索表现和索引状态",
                                url: "https://search.google.com/search-console",
                                icon: <Search className="h-6 w-6" />,
                                category: "分析工具",
                            },
                            {
                                name: "Schema Markup Validator",
                                description: "验证结构化数据格式",
                                url: "https://validator.schema.org/",
                                icon: <Code className="h-6 w-6" />,
                                category: "验证工具",
                            },
                            {
                                name: "PageSpeed Insights",
                                description: "分析页面加载性能",
                                url: "https://pagespeed.web.dev",
                                icon: <Target className="h-6 w-6" />,
                                category: "性能工具",
                            },
                            {
                                name: "Rich Results Test",
                                description: "测试富媒体搜索结果",
                                url: "https://search.google.com/test/rich-results",
                                icon: <FileText className="h-6 w-6" />,
                                category: "测试工具",
                            },
                            {
                                name: "Mobile-Friendly Test",
                                description: "测试移动端友好性",
                                url: "https://search.google.com/test/mobile-friendly",
                                icon: <Settings className="h-6 w-6" />,
                                category: "测试工具",
                            },
                            {
                                name: "Screaming Frog SEO Spider",
                                description: "网站爬虫和技术SEO分析",
                                url: "https://www.screamingfrog.co.uk/seo-spider/",
                                icon: <Link className="h-6 w-6" />,
                                category: "爬虫工具",
                            },
                        ].map((tool) => (
                            <Card
                                key={tool.name}
                                className="transition-shadow hover:shadow-md"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center text-base">
                                        {tool.icon}
                                        <span className="ml-2">
                                            {tool.name}
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        {tool.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">
                                            {tool.category}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a
                                                href={tool.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="mr-1 h-3 w-3" />
                                                访问
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
