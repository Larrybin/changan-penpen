/**
 * Admin Dashboard Data Prefetch Hook
 * 智能数据预取机制
 * 提升用户体验，减少等待时间
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminApiClient } from '@/modules/admin/api/client';
import { adminQueryKeys } from '@/lib/query/keys';

interface PrefetchOptions {
    enabled?: boolean;
    delay?: number; // 预取延迟（毫秒）
    priority?: 'high' | 'normal' | 'low';
}

/**
 * 仪表盘数据预取Hook
 */
export function useDashboardPrefetch(options: PrefetchOptions = {}) {
    const {
        enabled = true,
        delay = 1000, // 默认1秒后开始预取
        priority = 'normal'
    } = options;

    const queryClient = useQueryClient();
    const timeoutRef = useRef<NodeJS.Timeout>();
    const hasPrefetched = useRef(false);

    // 预取订单详情数据
    const prefetchOrderDetails = useCallback(async (orderId: number) => {
        if (!enabled || hasPrefetched.current) return;

        try {
            await queryClient.prefetchQuery({
                queryKey: [...adminQueryKeys.resource('orders'), orderId.toString()],
                queryFn: async () => {
                    const response = await adminApiClient.get(`/orders/${orderId}`);
                    return response.data;
                },
                staleTime: 1000 * 60, // 1分钟
            });
        } catch (error) {
            console.debug('[Prefetch] Failed to prefetch order details', { orderId, error });
        }
    }, [enabled, queryClient]);

    // 预取用户详情数据
    const prefetchUserDetails = useCallback(async (userId: string) => {
        if (!enabled || hasPrefetched.current) return;

        try {
            await queryClient.prefetchQuery({
                queryKey: [...adminQueryKeys.resource('users'), userId],
                queryFn: async () => {
                    const response = await adminApiClient.get(`/users/${userId}`);
                    return response.data;
                },
                staleTime: 1000 * 60 * 5, // 5分钟
            });
        } catch (error) {
            console.debug('[Prefetch] Failed to prefetch user details', { userId, error });
        }
    }, [enabled, queryClient]);

    // 预取积分历史数据
    const prefetchCreditsHistory = useCallback(async (tenantId?: string) => {
        if (!enabled || hasPrefetched.current) return;

        try {
            const params = tenantId ? `?tenantId=${tenantId}` : '';
            await queryClient.prefetchQuery({
                queryKey: [...adminQueryKeys.resource('credits-history'), tenantId],
                queryFn: async () => {
                    const response = await adminApiClient.get(`/credits-history${params}`);
                    return response.data;
                },
                staleTime: 1000 * 30, // 30秒
            });
        } catch (error) {
            console.debug('[Prefetch] Failed to prefetch credits history', { tenantId, error });
        }
    }, [enabled, queryClient]);

    // 预取目录数据（产品、优惠券、内容页面）
    const prefetchCatalogData = useCallback(async () => {
        if (!enabled || hasPrefetched.current) return;

        try {
            await Promise.allSettled([
                queryClient.prefetchQuery({
                    queryKey: [...adminQueryKeys.resource('products')],
                    queryFn: async () => {
                        const response = await adminApiClient.get('/products');
                        return response.data;
                    },
                    staleTime: 1000 * 60 * 2, // 2分钟
                }),
                queryClient.prefetchQuery({
                    queryKey: [...adminQueryKeys.resource('coupons')],
                    queryFn: async () => {
                        const response = await adminApiClient.get('/coupons');
                        return response.data;
                    },
                    staleTime: 1000 * 60 * 2, // 2分钟
                }),
                queryClient.prefetchQuery({
                    queryKey: [...adminQueryKeys.resource('content-pages')],
                    queryFn: async () => {
                        const response = await adminApiClient.get('/content-pages');
                        return response.data;
                    },
                    staleTime: 1000 * 60 * 2, // 2分钟
                }),
            ]);
        } catch (error) {
            console.debug('[Prefetch] Failed to prefetch catalog data', { error });
        }
    }, [enabled, queryClient]);

    // 智能预取：基于用户行为模式
    const startIntelligentPrefetch = useCallback((
        dashboardData: any,
        userBehavior?: {
            recentOrders?: boolean;
            catalogAccess?: boolean;
            userManagement?: boolean;
        }
    ) => {
        if (!enabled || hasPrefetched.current) return;

        // 清除之前的预取定时器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            hasPrefetched.current = true;

            const prefetchTasks: Promise<void>[] = [];

            // 基于仪表盘数据智能预取
            if (dashboardData?.latestOrders?.length > 0 && userBehavior?.recentOrders !== false) {
                // 预取最近几个订单的详情
                dashboardData.latestOrders.slice(0, 3).forEach((order: any) => {
                    if (order.id) {
                        prefetchTasks.push(prefetchOrderDetails(order.id));
                    }
                });
            }

            if (dashboardData?.recentCredits?.length > 0 && userBehavior?.userManagement !== false) {
                // 预取积分变动相关的用户详情
                const recentUserIds = dashboardData.recentCredits
                    .map((credit: any) => credit.customerEmail)
                    .filter(Boolean)
                    .slice(0, 2);

                recentUserIds.forEach((userId: string) => {
                    prefetchTasks.push(prefetchUserDetails(userId));
                });
            }

            // 根据优先级决定预取策略
            if (priority === 'high') {
                prefetchTasks.push(prefetchCatalogData());
            }

            // 执行预取任务
            try {
                await Promise.allSettled(prefetchTasks);
                console.debug('[Prefetch] Intelligent prefetch completed', {
                    tasksCount: prefetchTasks.length,
                    priority
                });
            } catch (error) {
                console.debug('[Prefetch] Some prefetch tasks failed', { error });
            }
        }, delay);
    }, [enabled, delay, priority, prefetchOrderDetails, prefetchUserDetails, prefetchCatalogData]);

    // 手动触发预取
    const manualPrefetch = useCallback(async (resources: string[] = []) => {
        if (!enabled) return;

        const tasks: Promise<void>[] = [];

        resources.forEach(resource => {
            switch (resource) {
                case 'orders':
                    tasks.push(prefetchOrderDetails(0)); // 使用通用键
                    break;
                case 'credits':
                    tasks.push(prefetchCreditsHistory());
                    break;
                case 'catalog':
                    tasks.push(prefetchCatalogData());
                    break;
                case 'users':
                    tasks.push(prefetchUserDetails('current'));
                    break;
            }
        });

        await Promise.allSettled(tasks);
    }, [enabled, prefetchOrderDetails, prefetchCreditsHistory, prefetchCatalogData, prefetchUserDetails]);

    // 清理预取状态
    const resetPrefetch = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        hasPrefetched.current = false;
    }, []);

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        prefetchOrderDetails,
        prefetchUserDetails,
        prefetchCreditsHistory,
        prefetchCatalogData,
        startIntelligentPrefetch,
        manualPrefetch,
        resetPrefetch,
        hasPrefetched: hasPrefetched.current,
    };
}

/**
 * 用户行为追踪Hook
 * 用于优化预取策略
 */
export function useUserBehaviorTracking() {
    const behaviorRef = useRef({
        recentOrders: false,
        catalogAccess: false,
        userManagement: false,
        lastAccess: new Date(),
        accessCount: 0,
    });

    const trackOrderAccess = useCallback(() => {
        behaviorRef.current.recentOrders = true;
        behaviorRef.current.lastAccess = new Date();
        behaviorRef.current.accessCount++;
    }, []);

    const trackCatalogAccess = useCallback(() => {
        behaviorRef.current.catalogAccess = true;
        behaviorRef.current.lastAccess = new Date();
        behaviorRef.current.accessCount++;
    }, []);

    const trackUserManagementAccess = useCallback(() => {
        behaviorRef.current.userManagement = true;
        behaviorRef.current.lastAccess = new Date();
        behaviorRef.current.accessCount++;
    }, []);

    const getBehaviorPattern = useCallback(() => {
        return { ...behaviorRef.current };
    }, []);

    return {
        trackOrderAccess,
        trackCatalogAccess,
        trackUserManagementAccess,
        getBehaviorPattern,
    };
}