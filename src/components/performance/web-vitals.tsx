"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useState } from "react";

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

interface WebVitalsMetrics {
    id: string;
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
    delta: number;
    timestamp: number;
}

/**
 * Core Web Vitals监控组件
 *
 * 功能：
 * - 监控LCP、INP、CLS等关键指标
 * - 集成Sentry错误追踪
 * - 开发环境实时显示
 * - 自定义性能报告
 *
 * 使用方法：
 * ```tsx
 * <WebVitals />
 * ```
 */
export function WebVitals() {
    const [metrics, setMetrics] = useState<WebVitalsMetrics[]>([]);
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        setIsDev(process.env.NODE_ENV === "development");
    }, []);

    const sendToAnalytics = useCallback(
        (metric: any) => {
            // 开发环境打印到控制台
            if (isDev) {
                console.info(`📊 Core Web Vitals - ${metric.name}:`, {
                    value: metric.value,
                    rating: metric.rating,
                    delta: metric.delta,
                    id: metric.id,
                });
            }

            // 发送到分析服务（可根据需要配置）
            if (
                typeof window !== "undefined" &&
                typeof window.gtag === "function"
            ) {
                window.gtag("event", metric.name, {
                    value: Math.round(
                        metric.name === "CLS"
                            ? metric.value * 1000
                            : metric.value,
                    ),
                    event_label: metric.id,
                    non_interaction: true,
                    metric_rating: metric.rating,
                    metric_delta: metric.delta,
                });
            }

            // 发送到自定义端点（可选）
            if (
                typeof window !== "undefined" &&
                typeof navigator.sendBeacon === "function"
            ) {
                const data = JSON.stringify({
                    ...metric,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now(),
                });

                // 这里可以配置你的分析端点
                // navigator.sendBeacon("/api/vitals", data);
            }
        },
        [isDev],
    );

    const handleWebVital = useCallback(
        (metric: any) => {
            // 更新本地状态
            const newMetric: WebVitalsMetrics = {
                id: metric.id,
                name: metric.name,
                value: metric.value,
                rating: metric.rating,
                delta: metric.delta,
                timestamp: Date.now(),
            };

            setMetrics((prev) => {
                const existingIndex = prev.findIndex(
                    (m) => m.name === metric.name,
                );
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = newMetric;
                    return updated;
                }
                return [...prev, newMetric];
            });

            // 发送到分析服务
            sendToAnalytics(metric);

            // 特殊处理关键指标
            switch (metric.name) {
                case "LCP":
                    if (metric.rating !== "good") {
                        console.warn(
                            `⚠️ LCP性能警告: ${metric.value.toFixed(2)}ms (${metric.rating})`,
                        );
                    }
                    break;
                case "INP":
                    if (metric.rating !== "good") {
                        console.warn(
                            `⚠️ INP性能警告: ${metric.value.toFixed(2)}ms (${metric.rating})`,
                        );
                    }
                    break;
                case "CLS":
                    if (metric.rating !== "good") {
                        console.warn(
                            `⚠️ CLS性能警告: ${metric.value.toFixed(4)} (${metric.rating})`,
                        );
                    }
                    break;
            }
        },
        [sendToAnalytics],
    );

    useReportWebVitals(handleWebVital);

    // 开发环境显示性能指标
    if (!isDev) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg z-50 max-w-sm">
            <h3 className="font-semibold text-sm mb-2">📊 Core Web Vitals</h3>
            <div className="space-y-1 text-xs">
                {metrics.length === 0 ? (
                    <div className="text-muted-foreground">等待性能数据...</div>
                ) : (
                    metrics.map((metric) => (
                        <div
                            key={metric.name}
                            className="flex justify-between items-center"
                        >
                            <span className="font-medium">{metric.name}:</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "text-xs",
                                        metric.rating === "good" &&
                                            "text-green-600",
                                        metric.rating === "needs-improvement" &&
                                            "text-yellow-600",
                                        metric.rating === "poor" &&
                                            "text-red-600",
                                    )}
                                >
                                    {formatMetricValue(
                                        metric.name,
                                        metric.value,
                                    )}
                                </span>
                                <div
                                    className={cn(
                                        "w-2 h-2 rounded-full",
                                        metric.rating === "good" &&
                                            "bg-green-600",
                                        metric.rating === "needs-improvement" &&
                                            "bg-yellow-600",
                                        metric.rating === "poor" &&
                                            "bg-red-600",
                                    )}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                <div className="flex justify-between">
                    <span>LCP &lt; 2.5s</span>
                    <span>INP &lt; 200ms</span>
                    <span>CLS &lt; 0.1</span>
                </div>
            </div>
        </div>
    );
}

// 格式化指标值显示
function formatMetricValue(name: string, value: number): string {
    switch (name) {
        case "LCP":
            return `${value.toFixed(0)}ms`;
        case "INP":
            return `${value.toFixed(0)}ms`;
        case "CLS":
            return value.toFixed(4);
        case "FCP":
            return `${value.toFixed(0)}ms`;
        case "TTFB":
            return `${value.toFixed(0)}ms`;
        default:
            return value.toFixed(2);
    }
}

// 条件类名工具函数
function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

// 性能指标阈值定义
export const WebVitalsThresholds = {
    LCP: {
        good: 2500,
        needsImprovement: 4000,
    },
    INP: {
        good: 200,
        needsImprovement: 500,
    },
    CLS: {
        good: 0.1,
        needsImprovement: 0.25,
    },
    FCP: {
        good: 1800,
        needsImprovement: 3000,
    },
    TTFB: {
        good: 800,
        needsImprovement: 1800,
    },
} as const;

// 性能评分计算工具
export function calculatePerformanceScore(metrics: WebVitalsMetrics[]): number {
    if (metrics.length === 0) return 0;

    const coreMetrics = ["LCP", "INP", "CLS"];
    const availableCoreMetrics = metrics.filter((m) =>
        coreMetrics.includes(m.name),
    );

    if (availableCoreMetrics.length === 0) return 0;

    let totalScore = 0;
    availableCoreMetrics.forEach((metric) => {
        switch (metric.rating) {
            case "good":
                totalScore += 100;
                break;
            case "needs-improvement":
                totalScore += 50;
                break;
            case "poor":
                totalScore += 0;
                break;
        }
    });

    return Math.round(totalScore / availableCoreMetrics.length);
}

// 自定义hook用于获取性能数据
export function useWebVitals() {
    const [metrics, setMetrics] = useState<WebVitalsMetrics[]>([]);
    const [score, setScore] = useState(0);

    const updateMetrics = useCallback((newMetric: WebVitalsMetrics) => {
        setMetrics((prev) => {
            const existingIndex = prev.findIndex(
                (m) => m.name === newMetric.name,
            );
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newMetric;
                return updated;
            }
            return [...prev, newMetric];
        });
    }, []);

    useEffect(() => {
        setScore(calculatePerformanceScore(metrics));
    }, [metrics]);

    return { metrics, score, updateMetrics };
}
