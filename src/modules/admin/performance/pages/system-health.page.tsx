/**
 * System Health Monitoring Page
 * 系统健康监控页面
 * 专注于系统健康状况和基础设施监控
 */

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceMonitor } from "@/modules/admin/components/performance-monitor";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Activity,
    Database,
    HardDrive,
    Wifi,
    Server,
    Clock,
    Zap,
    TrendingUp,
    RefreshCw,
    Settings
} from "lucide-react";

// 系统组件状态
interface SystemComponent {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    responseTime?: number;
    hitRate?: number;
    availability?: number;
    description: string;
    icon: React.ReactNode;
    lastChecked: string;
}

const systemComponents: SystemComponent[] = [
    {
        name: '数据库',
        status: 'healthy',
        responseTime: 45,
        availability: 99.9,
        description: 'Cloudflare D1 数据库连接和查询性能',
        icon: <Database className="h-5 w-5" />,
        lastChecked: '30秒前'
    },
    {
        name: '缓存服务',
        status: 'healthy',
        hitRate: 87,
        description: 'Upstash Redis 缓存命中率',
        icon: <Zap className="h-5 w-5" />,
        lastChecked: '30秒前'
    },
    {
        name: 'API服务',
        status: 'healthy',
        responseTime: 120,
        availability: 99.8,
        description: 'Cloudflare Workers API 响应性能',
        icon: <Server className="h-5 w-5" />,
        lastChecked: '30秒前'
    },
    {
        name: '存储服务',
        status: 'warning',
        availability: 98.5,
        description: 'Cloudflare R2 对象存储状态',
        icon: <HardDrive className="h-5 w-5" />,
        lastChecked: '1分钟前'
    },
    {
        name: 'CDN网络',
        status: 'healthy',
        responseTime: 85,
        description: 'Cloudflare CDN 全球网络状态',
        icon: <Wifi className="h-5 w-5" />,
        lastChecked: '30秒前'
    }
];

export default function SystemHealthPage() {
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

    const healthyCount = systemComponents.filter(c => c.status === 'healthy').length;
    const warningCount = systemComponents.filter(c => c.status === 'warning').length;
    const criticalCount = systemComponents.filter(c => c.status === 'critical').length;

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="系统健康监控"
                description="实时监控系统各组件健康状况，包括数据库、缓存、API服务和存储基础设施，确保系统稳定运行。"
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            监控设置
                        </Button>
                        <Button variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            立即检查
                        </Button>
                    </div>
                }
            />

            {/* 系统健康概览 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            系统健康状态
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="text-4xl font-bold text-green-600">良好</div>
                            <Badge className="bg-green-50 text-green-600">
                                {criticalCount === 0 && warningCount <= 1 ? '正常运行' : '需要注意'}
                            </Badge>
                            <Progress value={(healthyCount / systemComponents.length) * 100} className="w-full mt-2" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            正常组件
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
                        <p className="text-xs text-muted-foreground">
                            个组件运行正常
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                            警告组件
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                        <p className="text-xs text-muted-foreground">
                            个组件需要关注
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                            <XCircle className="h-4 w-4 mr-2 text-red-600" />
                            故障组件
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                        <p className="text-xs text-muted-foreground">
                            个组件需要立即处理
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 系统监控面板 */}
            <Tabs defaultValue="components" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="components">组件状态</TabsTrigger>
                    <TabsTrigger value="performance">性能指标</TabsTrigger>
                    <TabsTrigger value="alerts">报警记录</TabsTrigger>
                    <TabsTrigger value="logs">系统日志</TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="space-y-4">
                    <div className="grid gap-4">
                        {systemComponents.map((component, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center text-base">
                                            {component.icon}
                                            <span className="ml-2">{component.name}</span>
                                        </CardTitle>
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(component.status)}
                                            <Badge className={getStatusColor(component.status)}>
                                                {component.status === 'healthy' ? '正常' :
                                                 component.status === 'warning' ? '警告' : '故障'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardDescription>{component.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {component.responseTime && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">响应时间</div>
                                                <div className="text-lg font-semibold">
                                                    {component.responseTime}ms
                                                    <span className="text-sm text-green-600 ml-2">
                                                        {component.responseTime < 100 ? '优秀' :
                                                         component.responseTime < 300 ? '良好' : '需优化'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {component.hitRate && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">命中率</div>
                                                <div className="text-lg font-semibold">
                                                    {component.hitRate}%
                                                    <Progress value={component.hitRate} className="mt-1 h-2" />
                                                </div>
                                            </div>
                                        )}

                                        {component.availability && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-muted-foreground">可用性</div>
                                                <div className="text-lg font-semibold">
                                                    {component.availability}%
                                                    <Progress value={component.availability} className="mt-1 h-2" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                        <span className="text-sm text-muted-foreground">
                                            最后检查: {component.lastChecked}
                                        </span>
                                        <Button variant="outline" size="sm">
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            检查
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <PerformanceMonitor />

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    系统性能趋势
                                </CardTitle>
                                <CardDescription>
                                    过去24小时的系统性能指标
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { metric: '平均响应时间', value: '145ms', trend: 'stable', change: '0%' },
                                    { metric: 'API请求量', value: '12.5k', trend: 'up', change: '+8%' },
                                    { metric: '错误率', value: '0.2%', trend: 'down', change: '-15%' },
                                    { metric: '并发连接数', value: '342', trend: 'up', change: '+12%' },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{item.metric}</div>
                                            <div className="text-sm text-muted-foreground">当前值: {item.value}</div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {item.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                                            {item.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />}
                                            {item.trend === 'stable' && <Activity className="h-4 w-4 text-blue-600" />}
                                            <span className={`text-sm font-medium ${
                                                item.trend === 'up' && !item.metric.includes('错误') ? 'text-green-600' :
                                                item.trend === 'down' && item.metric.includes('错误') ? 'text-green-600' :
                                                'text-red-600'
                                            }`}>
                                                {item.change}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                    <div className="space-y-4">
                        {[
                            {
                                level: 'warning',
                                title: '存储服务响应缓慢',
                                description: 'R2存储服务响应时间超过1秒，建议检查存储配置',
                                time: '15分钟前',
                                component: '存储服务'
                            },
                            {
                                level: 'info',
                                title: '系统例行检查完成',
                                description: '所有组件例行健康检查已完成，系统运行正常',
                                time: '30分钟前',
                                component: '系统监控'
                            }
                        ].map((alert, index) => (
                            <Alert key={index} className={
                                alert.level === 'critical' ? 'border-red-200 bg-red-50' :
                                alert.level === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                                'border-blue-200 bg-blue-50'
                            }>
                                <AlertTriangle className={`h-4 w-4 ${
                                    alert.level === 'critical' ? 'text-red-600' :
                                    alert.level === 'warning' ? 'text-yellow-600' :
                                    'text-blue-600'
                                }`} />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">{alert.title}</h4>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline">{alert.component}</Badge>
                                                <span className="text-xs text-muted-foreground">{alert.time}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {alert.description}
                                        </p>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>系统日志</CardTitle>
                            <CardDescription>
                                实时系统运行日志和事件记录
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 font-mono text-sm">
                                {[
                                    { time: '14:32:15', level: 'INFO', message: 'System health check completed successfully' },
                                    { time: '14:31:45', level: 'INFO', message: 'Database connection established' },
                                    { time: '14:31:30', level: 'WARN', message: 'Storage service response time: 1.2s' },
                                    { time: '14:31:00', level: 'INFO', message: 'Cache hit rate: 87%' },
                                    { time: '14:30:30', level: 'INFO', message: 'API request processed: GET /api/v1/admin/dashboard' },
                                ].map((log, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50">
                                        <span className="text-muted-foreground">{log.time}</span>
                                        <Badge variant={log.level === 'ERROR' ? 'destructive' : 'outline'} className="text-xs">
                                            {log.level}
                                        </Badge>
                                        <span className="flex-1">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}