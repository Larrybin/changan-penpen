"use client";

import {
    type Mutation,
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
    focusManager,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ApiErrorDetails as ApiClientErrorDetails } from "@/lib/api-client";
import { ApiError } from "@/lib/http-error";
import { secureRandomNumber } from "@/lib/random";
import { toast } from "@/lib/toast";

function extractRetryAfter(details: unknown) {
    const record = details as ApiClientErrorDetails | undefined;
    if (!record || typeof record !== "object") {
        return undefined;
    }
    const retryAfter = record.retryAfterSeconds;
    return typeof retryAfter === "number" && Number.isFinite(retryAfter)
        ? retryAfter
        : undefined;
}

function extractRateLimit(details: unknown) {
    const record = details as ApiClientErrorDetails | undefined;
    if (!record || typeof record !== "object") {
        return undefined;
    }
    if (!record.rateLimit || typeof record.rateLimit !== "object") {
        return undefined;
    }
    const { limit, remaining, reset } = record.rateLimit;
    return {
        limit: typeof limit === "number" ? limit : undefined,
        remaining: typeof remaining === "number" ? remaining : undefined,
        reset: typeof reset === "number" ? reset : undefined,
    };
}

function notifyError(error: unknown) {
    if (typeof window === "undefined") {
        return;
    }

    if (error instanceof ApiError) {
        const retryAfter = extractRetryAfter(error.details);
        const rateLimit = extractRateLimit(error.details);
        const descriptionParts: string[] = [];
        if (error.status === 429 && retryAfter) {
            descriptionParts.push(`请在 ${retryAfter} 秒后再试。`);
        }
        if (
            error.status === 429 &&
            rateLimit?.remaining === 0 &&
            rateLimit.reset
        ) {
            const resetSeconds = Math.max(
                rateLimit.reset - Math.floor(Date.now() / 1000),
                0,
            );
            if (resetSeconds > 0) {
                descriptionParts.push(`配额将于 ${resetSeconds} 秒后重置。`);
            }
        }

        const description = descriptionParts.join(" ");

        toast.error(
            description ? `${error.message}\n${description}` : error.message,
            {
                id: `admin-query-error-${error.code ?? error.status}`,
            },
        );
        return;
    }

    if (error instanceof Error) {
        toast.error(error.message, {
            id: `admin-query-error-generic`,
        });
        return;
    }

    toast.error("请求失败，请稍后再试。", {
        id: `admin-query-error-unknown`,
    });
}

type InvalidationDescriptor = { refetch: boolean };

const pendingInvalidations = new Map<string, InvalidationDescriptor>();
const pendingRefetchKeys = new Set<string>();
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let documentVisible =
    typeof document === "undefined" ? true : document.visibilityState === "visible";

function flushPendingRefetches(queryClient: QueryClient) {
    if (pendingRefetchKeys.size === 0) {
        return;
    }

    const keys = Array.from(pendingRefetchKeys);
    pendingRefetchKeys.clear();
    keys.forEach((key) => {
        void queryClient.refetchQueries({ queryKey: [key], type: "active" });
    });
}

function flushInvalidations(queryClient: QueryClient) {
    if (pendingInvalidations.size === 0) {
        return;
    }

    const entries = Array.from(pendingInvalidations.entries());
    pendingInvalidations.clear();

    entries.forEach(([key, descriptor]) => {
        queryClient.invalidateQueries({ queryKey: [key] });
        if (descriptor.refetch) {
            if (documentVisible) {
                void queryClient.refetchQueries({
                    queryKey: [key],
                    type: "active",
                });
            } else {
                pendingRefetchKeys.add(key);
            }
        }
    });

    if (documentVisible) {
        flushPendingRefetches(queryClient);
    }
}

function scheduleInvalidationFlush(queryClient: QueryClient) {
    if (flushTimeout !== null) {
        return;
    }

    flushTimeout = setTimeout(() => {
        flushTimeout = null;
        const client = getQueryClientInstance();
        if (client) {
            flushInvalidations(client);
        }
    }, 50);
}

function enqueueInvalidations(
    items: Array<{ key: string; refetch?: boolean }>,
): void {
    if (items.length === 0) {
        return;
    }

    const queryClient = getQueryClientInstance();
    if (!queryClient) {
        return;
    }

    let didAdd = false;
    items.forEach(({ key, refetch }) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) {
            return;
        }
        const existing = pendingInvalidations.get(trimmedKey);
        if (existing) {
            existing.refetch = existing.refetch || Boolean(refetch);
            return;
        }
        pendingInvalidations.set(trimmedKey, {
            refetch: Boolean(refetch),
        });
        didAdd = true;
    });

    if (didAdd || pendingInvalidations.size > 0) {
        scheduleInvalidationFlush(queryClient);
    }
}

/**
 * Admin Dashboard Query Client
 * 优化的查询配置，配合后端缓存策略
 */
function createAdminQueryClient() {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: notifyError,
            // 添加缓存统计（暂不输出日志）
            onSuccess: () => {
                // 保留钩子，后续可接入统计系统
            },
        }),
        mutationCache: new MutationCache({
            onError: notifyError,
            // 变更成功后主动失效相关缓存
            onSuccess: (_data, _variables, _context, mutation) => {
                // 基于变更类型触发缓存失效
                handleMutationCacheInvalidation(mutation);
            },
        }),
        defaultOptions: {
            queries: {
                // 智能缓存策略 - 配合后端TTL
                staleTime: 1000 * 30, // 30秒内认为数据是新鲜的
                gcTime: 1000 * 60 * 5, // 5分钟后从内存清除
                refetchOnWindowFocus: false, // 减少不必要的网络请求
                refetchOnReconnect: true, // 重连时重新获取数据
                refetchInterval: false, // 禁用自动轮询

                // 智能重试策略
                retry: (failureCount, error) => {
                    if (error instanceof ApiError) {
                        // 4xx 错误不重试
                        if (error.status >= 400 && error.status < 500) {
                            return false;
                        }
                        // 5xx 错误最多重试2次
                        if (error.status >= 500) {
                            return failureCount < 2;
                        }
                        // 429 限流错误不重试
                        if (error.status === 429) {
                            return false;
                        }
                    }
                    // 其他错误最多重试1次
                    return failureCount < 1;
                },

                // 重试延迟策略 - 指数退避
                retryDelay: (attemptIndex) => {
                    const baseDelay = 1000; // 1秒基础延迟
                    const maxDelay = 10000; // 最大10秒延迟
                    const delay = Math.min(
                        baseDelay * 2 ** attemptIndex,
                        maxDelay,
                    );
                    return delay + secureRandomNumber(0, 1000); // 添加随机抖动
                },

                // 网络状态变化处理
                networkMode: "online",
            },
            mutations: {
                // 变更重试策略
                retry: (failureCount, error) => {
                    if (error instanceof ApiError) {
                        // 4xx 错误不重试（用户错误）
                        if (error.status >= 400 && error.status < 500) {
                            return false;
                        }
                        // 5xx 错误最多重试1次
                        if (error.status >= 500) {
                            return failureCount < 1;
                        }
                    }
                    return false; // 变更操作默认不重试
                },

                // 变更重试延迟
                retryDelay: (_attemptIndex) => {
                    return 1000 + secureRandomNumber(0, 1000); // 1-2秒随机延迟
                },

                // 网络状态变化处理
                networkMode: "online",
            },
        },
    });
}

/**
 * 处理变更操作的缓存失效
 */
function handleMutationCacheInvalidation(
    mutation: Mutation<unknown, unknown, unknown, unknown>,
): void {
    const mutationKey = mutation.options?.mutationKey?.[0] as
        | string
        | undefined;

    if (!mutationKey) return;
    if (!getQueryClientInstance()) {
        return;
    }

    // 根据不同的变更类型失效相应的查询缓存
    const invalidationMap: Record<string, string[]> = {
        createOrder: ["dashboard", "orders:latest"],
        updateOrder: ["dashboard", "orders:latest", "orders:detail"],
        createCredit: ["dashboard", "credits:recent"],
        updateCredit: ["dashboard", "credits:recent"],
        createProduct: ["dashboard", "catalog"],
        updateProduct: ["dashboard", "catalog", "products:detail"],
        deleteProduct: ["dashboard", "catalog", "products:list"],
        createCoupon: ["dashboard", "catalog"],
        updateCoupon: ["dashboard", "catalog", "coupons:detail"],
        deleteCoupon: ["dashboard", "catalog", "coupons:list"],
        createContent: ["dashboard", "catalog"],
        updateContent: ["dashboard", "catalog", "content:detail"],
        deleteContent: ["dashboard", "catalog", "content:list"],
    };

    const keysToInvalidate = invalidationMap[mutationKey] || [];

    enqueueInvalidations(keysToInvalidate.map((key) => ({ key })));

    if (
        mutationKey.includes("dashboard") ||
        keysToInvalidate.includes("dashboard")
    ) {
        enqueueInvalidations([{ key: "dashboard", refetch: true }]);
    }
}

// 全局查询客户端实例（用于缓存失效）
let globalQueryClient: QueryClient | null = null;

function getQueryClientInstance(): QueryClient | null {
    return globalQueryClient;
}

export function setQueryClientInstance(client: QueryClient): void {
    globalQueryClient = client;
}

/**
 * 手动触发缓存失效的便捷函数
 */
export function invalidateAdminQueries(
    queryKeys: string[] | string,
    options?: { refetch?: boolean },
): void {
    if (!getQueryClientInstance()) {
        return;
    }

    const keys = Array.isArray(queryKeys) ? queryKeys : [queryKeys];

    enqueueInvalidations(
        keys.map((key) => ({ key, refetch: Boolean(options?.refetch) })),
    );
}

/**
 * 预取数据的便捷函数
 */
export async function prefetchAdminQuery<T>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    options?: { staleTime?: number },
): Promise<void> {
    const client = getQueryClientInstance();
    if (!client) return;

    await client.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: options?.staleTime || 1000 * 30,
    });
}

export function AdminQueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [client] = useState(() => {
        const queryClient = createAdminQueryClient();
        setQueryClientInstance(queryClient); // 设置全局实例
        return queryClient;
    });

    useEffect(() => {
        if (typeof document === "undefined") {
            return;
        }

        const handleVisibilityChange = () => {
            const visible = document.visibilityState === "visible";
            documentVisible = visible;
            focusManager.setFocused(visible);
            if (visible) {
                flushInvalidations(client);
                flushPendingRefetches(client);
            }
        };

        handleVisibilityChange();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [client]);

    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}
