/**
 * Admin Dashboard Performance Monitor
 * 性能监控组件
 * 实时监控缓存命中率和响应时间
 */

import { Activity, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PerformanceDiagnostics } from "@/app/(dynamic)/api/v1/admin/performance/diagnostics/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DiagnosticsResponse {
    success: boolean;
    data?: PerformanceDiagnostics;
    error?: {
        code?: string;
        message?: string;
    };
}

const PERFORMANCE_DIAGNOSTICS_ENDPOINT =
    "/api/v1/admin/performance/diagnostics";
const REFRESH_INTERVAL_MS = 60_000;

async function requestPerformanceDiagnostics(
    signal?: AbortSignal,
): Promise<PerformanceDiagnostics> {
    const response = await fetch(PERFORMANCE_DIAGNOSTICS_ENDPOINT, {
        method: "GET",
        cache: "no-store",
        headers: {
            Accept: "application/json",
        },
        signal,
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as DiagnosticsResponse;

    if (!payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Failed to load diagnostics");
    }

    return payload.data;
}

function isAbortError(error: unknown) {
    return (
        typeof DOMException !== "undefined" &&
        error instanceof DOMException &&
        error.name === "AbortError"
    );
}

function extractErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }
    return "Unknown error";
}

/**
 * 性能监控仪表盘组件
 */
export function PerformanceMonitor() {
    const [metrics, setMetrics] = useState<PerformanceDiagnostics | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
        if (typeof document === "undefined") {
            return true;
        }
        return document.visibilityState === "visible";
    });
    const [isIntersecting, setIsIntersecting] = useState(true);
    const monitorRef = useRef<HTMLDivElement | null>(null);
    const lastFetchAtRef = useRef<number>(0);
    const isFetchingRef = useRef(false);

    const autoRefreshAbortControllerRef = useRef<AbortController | null>(null);
    const autoRefreshEnabledRef = useRef(false);

    const prepareAutoRefreshController = useCallback(
        (origin: "auto" | "manual", controller: AbortController) => {
            if (origin !== "auto") {
                return;
            }
            autoRefreshAbortControllerRef.current?.abort();
            autoRefreshAbortControllerRef.current = controller;
        },
        [],
    );

    const finalizeAutoRefreshController = useCallback(
        (origin: "auto" | "manual", controller: AbortController) => {
            if (
                origin === "auto" &&
                autoRefreshAbortControllerRef.current === controller
            ) {
                autoRefreshAbortControllerRef.current = null;
            }
        },
        [],
    );

    const fetchMetrics = useCallback(
        async (options?: { silent?: boolean; origin?: "auto" | "manual" }) => {
            if (isFetchingRef.current) {
                return;
            }

            const origin = options?.origin ?? "manual";
            const silent = options?.silent ?? false;
            const controller = new AbortController();

            prepareAutoRefreshController(origin, controller);

            isFetchingRef.current = true;
            if (!silent) {
                setIsLoading(true);
            }
            setError(null);

            try {
                const diagnostics = await requestPerformanceDiagnostics(
                    controller.signal,
                );
                lastFetchAtRef.current = Date.now();
                setMetrics(diagnostics);
            } catch (fetchError) {
                if (isAbortError(fetchError)) {
                    return;
                }

                console.error(
                    "Failed to fetch performance diagnostics",
                    fetchError,
                );
                setError(extractErrorMessage(fetchError));
            } finally {
                finalizeAutoRefreshController(origin, controller);
                isFetchingRef.current = false;
                setIsLoading(false);
            }
        },
        [finalizeAutoRefreshController, prepareAutoRefreshController],
    );

    useEffect(() => {
        void fetchMetrics();
    }, [fetchMetrics]);

    useEffect(() => {
        autoRefreshEnabledRef.current = autoRefresh;
    }, [autoRefresh]);

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        const handleVisibilityChange = () => {
            const visible = document.visibilityState === "visible";
            setIsDocumentVisible(visible);
            if (visible && autoRefreshEnabledRef.current) {
                void fetchMetrics({ silent: true });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [fetchMetrics]);

    useEffect(() => {
        if (typeof IntersectionObserver === "undefined") {
            return;
        }

        const node = monitorRef.current;
        if (!node) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            setIsIntersecting(entry?.isIntersecting ?? false);
        });

        observer.observe(node);
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!autoRefresh || !isDocumentVisible || !isIntersecting) {
            autoRefreshAbortControllerRef.current?.abort();
            return;
        }

        const now = Date.now();
        if (
            !isFetchingRef.current &&
            now - lastFetchAtRef.current >= REFRESH_INTERVAL_MS
        ) {
            void fetchMetrics({ silent: true, origin: "auto" });
        }

        const interval = setInterval(() => {
            if (
                !isDocumentVisible ||
                !isIntersecting ||
                isFetchingRef.current
            ) {
                return;
            }

            const next = Date.now();
            if (next - lastFetchAtRef.current < REFRESH_INTERVAL_MS) {
                return;
            }

            void fetchMetrics({ silent: true, origin: "auto" });
        }, REFRESH_INTERVAL_MS);

        return () => {
            clearInterval(interval);
            autoRefreshAbortControllerRef.current?.abort();
        };
    }, [autoRefresh, fetchMetrics, isDocumentVisible, isIntersecting]);

    const getHitRateColor = (hitRate: number) => {
        if (hitRate >= 80) return "text-green-600";
        if (hitRate >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getResponseTimeColor = (time: number) => {
        if (time <= 200) return "text-green-600";
        if (time <= 500) return "text-yellow-600";
        return "text-red-600";
    };

    if (!metrics) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
                    {isLoading ? (
                        <div className="text-center">
                            <Activity className="mx-auto mb-2 h-8 w-8 animate-pulse text-muted-foreground" />
                            <p className="text-muted-foreground">
                                加载性能指标中...
                            </p>
                        </div>
                    ) : (
                        <>
                            <Alert
                                variant="danger"
                                className="max-w-md text-center"
                            >
                                <AlertTitle>加载性能指标失败</AlertTitle>
                                <AlertDescription>
                                    {error ?? "请稍后重试。"}
                                </AlertDescription>
                            </Alert>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void fetchMetrics()}
                                disabled={isLoading}
                            >
                                重新加载
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div ref={monitorRef} className="space-y-6">
            {error && (
                <Alert variant="warning">
                    <AlertTitle>无法更新最新性能数据</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {/* 控制栏 */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">性能监控</h3>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh((prev) => !prev)}
                    >
                        {autoRefresh ? "停止" : "开始"} 自动刷新
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void fetchMetrics()}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={cn(
                                "mr-1 h-4 w-4",
                                isLoading && "animate-spin",
                            )}
                        />
                        刷新
                    </Button>
                </div>
            </div>

            {/* 缓存性能指标 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-muted-foreground text-sm">
                            缓存命中率
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <span
                                className={cn(
                                    "font-bold text-2xl",
                                    getHitRateColor(metrics.cacheStats.hitRate),
                                )}
                            >
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
                        <p className="mt-1 text-muted-foreground text-xs">
                            {metrics.cacheStats.hits} 次命中 /{" "}
                            {metrics.cacheStats.misses} 次未命中
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-muted-foreground text-sm">
                            平均响应时间
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <span
                                className={cn(
                                    "font-bold text-2xl",
                                    getResponseTimeColor(
                                        metrics.responseTime.average,
                                    ),
                                )}
                            >
                                {Math.round(metrics.responseTime.average)}ms
                            </span>
                            <Badge variant="outline" className="text-xs">
                                P95: {Math.round(metrics.responseTime.p95)}ms
                            </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                            <span>
                                最快: {Math.round(metrics.responseTime.min)}ms
                            </span>
                            <span>
                                最慢: {Math.round(metrics.responseTime.max)}ms
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-muted-foreground text-sm">
                            缓存失效事件
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-bold text-2xl">
                            {metrics.invalidationStats.totalEvents}
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                            过去1小时
                        </p>
                        {Object.keys(metrics.invalidationStats.eventsByType)
                            .length > 0 && (
                            <div className="mt-2 space-y-1">
                                {Object.entries(
                                    metrics.invalidationStats.eventsByType,
                                )
                                    .slice(0, 3)
                                    .map(([event, count]) => (
                                        <div
                                            key={event}
                                            className="flex justify-between text-xs"
                                        >
                                            <span className="text-muted-foreground">
                                                {event}
                                            </span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-medium text-muted-foreground text-sm">
                            系统状态
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            <span className="font-medium text-sm">
                                运行正常
                            </span>
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                            更新时间:{" "}
                            {new Date(metrics.timestamp).toLocaleTimeString()}
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
                                <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-600"
                                >
                                    建议优化
                                </Badge>
                                <p className="text-muted-foreground text-sm">
                                    缓存命中率偏低({metrics.cacheStats.hitRate}
                                    %)，建议增加缓存时间或优化缓存策略
                                </p>
                            </div>
                        )}

                        {metrics.responseTime.average > 500 && (
                            <div className="flex items-start space-x-2">
                                <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-600"
                                >
                                    需要关注
                                </Badge>
                                <p className="text-muted-foreground text-sm">
                                    平均响应时间较长(
                                    {Math.round(metrics.responseTime.average)}
                                    ms)，建议检查数据库查询或API性能
                                </p>
                            </div>
                        )}

                        {metrics.cacheStats.hitRate >= 80 &&
                            metrics.responseTime.average <= 200 && (
                                <div className="flex items-start space-x-2">
                                    <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-600"
                                    >
                                        性能良好
                                    </Badge>
                                    <p className="text-muted-foreground text-sm">
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
        let isMounted = true;

        const fetchHitRate = async () => {
            try {
                const diagnostics = await requestPerformanceDiagnostics();
                if (isMounted) {
                    setHitRate(diagnostics.cacheStats.hitRate);
                }
            } catch (_error) {
                // 静默失败
            }
        };

        void fetchHitRate();
        const interval = setInterval(() => {
            void fetchHitRate();
        }, 60000); // 每分钟更新

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    if (hitRate === null) return null;

    const getVariant = () => {
        if (hitRate >= 80) return "default";
        if (hitRate >= 60) return "secondary";
        return "destructive";
    };

    return (
        <Badge variant={getVariant()} className="text-xs">
            缓存 {hitRate}%
        </Badge>
    );
}
export default PerformanceMonitor;
