/**
 * Enhanced Loading States for Admin Dashboard
 * 增强的加载状态组件
 * 提升用户体验和感知性能
 */

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    isLoading: boolean;
    error?: Error | null;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    showRetryButton?: boolean;
    onRetry?: () => void;
    className?: string;
}

/**
 * 增强的加载状态包装器
 */
export function EnhancedLoadingState({
    isLoading,
    error,
    children,
    fallback,
    errorFallback,
    showRetryButton = true,
    onRetry,
    className,
}: LoadingStateProps) {
    const [showDelay, setShowDelay] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // 延迟显示加载状态，避免闪烁
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isLoading) {
            timeout = setTimeout(() => {
                setShowDelay(true);
            }, 200); // 200ms延迟
        } else {
            setShowDelay(false);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [isLoading]);

    const handleRetry = () => {
        setRetryCount((prev) => prev + 1);
        onRetry?.();
    };

    if (error) {
        return (
            <Card className={cn("border-destructive/50", className)}>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                        加载失败
                    </h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        {error.message || "数据加载失败，请稍后重试"}
                    </p>
                    {errorFallback ||
                        (showRetryButton && (
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                disabled={isLoading}
                            >
                                <RefreshCw
                                    className={cn(
                                        "h-4 w-4 mr-2",
                                        isLoading && "animate-spin",
                                    )}
                                />
                                重试 {retryCount > 0 && `(${retryCount})`}
                            </Button>
                        ))}
                </CardContent>
            </Card>
        );
    }

    if (isLoading && showDelay) {
        return (
            <div className={className}>
                {fallback || <DefaultLoadingFallback />}
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * 默认的加载回退组件
 */
function DefaultLoadingFallback() {
    return (
        <div className="space-y-6">
            {/* 模拟统计卡片加载 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-20" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 模拟图表加载 */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-24" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 模拟表格加载 */}
            <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }, (_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                {Array.from({ length: 4 }, (_, j) => (
                                    <div
                                        key={j}
                                        className="flex items-center space-x-4"
                                    >
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * 进度条加载组件
 */
interface ProgressLoadingProps {
    progress?: number;
    message?: string;
    showPercentage?: boolean;
    className?: string;
}

export function ProgressLoading({
    progress,
    message = "加载中...",
    showPercentage = true,
    className,
}: ProgressLoadingProps) {
    const [displayProgress, setDisplayProgress] = useState(0);

    useEffect(() => {
        if (progress !== undefined) {
            const timer = setTimeout(() => {
                setDisplayProgress(progress);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    return (
        <div
            className={cn(
                "flex flex-col items-center space-y-4 py-8",
                className,
            )}
        >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{message}</p>
                {showPercentage && progress !== undefined && (
                    <p className="text-xs text-muted-foreground">
                        {Math.round(displayProgress)}%
                    </p>
                )}
            </div>
            {progress !== undefined && (
                <div className="w-full max-w-sm">
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${displayProgress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 智能加载指示器
 * 根据加载时间和状态显示不同的指示器
 */
interface SmartLoaderProps {
    isLoading: boolean;
    startTime?: number;
    timeout?: number;
    onTimeout?: () => void;
    children: React.ReactNode;
}

export function SmartLoader({
    isLoading,
    startTime = Date.now(),
    timeout = 10000, // 10秒超时
    onTimeout,
    children,
}: SmartLoaderProps) {
    const [elapsed, setElapsed] = useState(0);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setElapsed(0);
            setIsTimeout(false);
            return;
        }

        const interval = setInterval(() => {
            const currentElapsed = Date.now() - startTime;
            setElapsed(currentElapsed);

            if (currentElapsed >= timeout && !isTimeout) {
                setIsTimeout(true);
                onTimeout?.();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isLoading, startTime, timeout, isTimeout, onTimeout]);

    if (!isLoading) {
        return <>{children}</>;
    }

    // 根据加载时间显示不同的状态
    let message = "加载中...";
    let showProgress = false;

    if (elapsed < 1000) {
        message = "正在加载...";
    } else if (elapsed < 3000) {
        message = "正在处理数据...";
        showProgress = true;
    } else if (elapsed < 6000) {
        message = "数据量较大，请稍候...";
        showProgress = true;
    } else if (elapsed < timeout) {
        message = "正在优化加载...";
        showProgress = true;
    } else {
        message = "加载时间过长，请检查网络连接";
    }

    const progress = showProgress
        ? Math.min((elapsed / timeout) * 100, 100)
        : undefined;

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <ProgressLoading
                progress={progress}
                message={message}
                showPercentage={showProgress}
            />
            {isTimeout && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-destructive mb-2">
                        加载超时，您可以：
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                    >
                        刷新页面
                    </Button>
                </div>
            )}
        </div>
    );
}

/**
 * 骨架屏组件库
 */
export const SkeletonLibrary = {
    // 统计卡片骨架屏
    StatsCards: ({ count = 4 }: { count?: number }) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }, (_, i) => (
                <Card key={i}>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-20" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16" />
                    </CardContent>
                </Card>
            ))}
        </div>
    ),

    // 表格骨架屏
    Table: ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
        <div className="space-y-3">
            <div className="flex items-center space-x-4">
                {Array.from({ length: columns }, (_, i) => (
                    <Skeleton key={i} className="h-4 w-20" />
                ))}
            </div>
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    {Array.from({ length: columns }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-16" />
                    ))}
                </div>
            ))}
        </div>
    ),

    // 图表骨架屏
    Chart: ({ height = 300 }: { height?: number }) => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <Skeleton
                    className="w-full"
                    style={{ height: `${height}px` }}
                />
            </CardContent>
        </Card>
    ),

    // 表单骨架屏
    Form: ({ fields = 3 }: { fields?: number }) => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: fields }, (_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <Skeleton className="h-10 w-20" />
                </div>
            </CardContent>
        </Card>
    ),
};

export default EnhancedLoadingState;
