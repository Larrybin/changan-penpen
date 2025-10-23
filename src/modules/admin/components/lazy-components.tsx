/**
 * Admin Dashboard Lazy Components
 * 组件懒加载系统，减少初始包大小
 * 提升首屏加载性能
 */

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 基础骨架屏组件
const TableSkeleton = () => (
    <div className="space-y-3">
        <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
            </div>
        ))}
    </div>
);

const CardSkeleton = ({ count = 1 }: { count?: number }) => (
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
);

const ChartSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-64 w-full" />
        </CardContent>
    </Card>
);

// 懒加载的核心业务组件
export const LazyUserDetail = lazy(() =>
    import('@/modules/admin/users/components/user-detail.client').then(module => ({
        default: module.UserDetail
    }))
);

export const LazyUsersListClient = lazy(() =>
    import('@/modules/admin/users/components/users-list-client').then(module => ({
        default: module.UsersListClient
    }))
);

export const LazyTodoForm = lazy(() =>
    import('@/modules/admin/todos/components/todo-form').then(module => ({
        default: module.TodoForm
    }))
);

export const LazyProductForm = lazy(() =>
    import('@/modules/admin/catalog/components/product-form').then(module => ({
        default: module.ProductForm
    }))
);

export const LazyCouponForm = lazy(() =>
    import('@/modules/admin/catalog/components/coupon-form').then(module => ({
        default: module.CouponForm
    }))
);

export const LazyContentPageForm = lazy(() =>
    import('@/modules/admin/catalog/components/content-page-form').then(module => ({
        default: module.ContentPageForm
    }))
);

export const LazyAdminResourceTable = lazy(() =>
    import('@/modules/admin/components/admin-resource-table').then(module => ({
        default: module.AdminResourceTable
    }))
);

export const LazyAdminResourceForm = lazy(() =>
    import('@/modules/admin/components/admin-resource-form').then(module => ({
        default: module.AdminResourceForm
    }))
);

// 统一的懒加载包装器组件
interface LazyWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
}

export function LazyWrapper({
    children,
    fallback,
    className = ""
}: LazyWrapperProps) {
    return (
        <div className={className}>
            <Suspense fallback={fallback || <div className="animate-pulse">加载中...</div>}>
                {children}
            </Suspense>
        </div>
    );
}

// 预定义的懒加载组件包装器
export const LazyUserDetailWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>用户详情</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyUserDetail {...props} />
    </LazyWrapper>
);

export const LazyUsersListClientWrapper = (props: any) => (
    <LazyWrapper fallback={<TableSkeleton />}>
        <LazyUsersListClient {...props} />
    </LazyWrapper>
);

export const LazyTodoFormWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>任务表单</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyTodoForm {...props} />
    </LazyWrapper>
);

export const LazyProductFormWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>产品表单</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyProductForm {...props} />
    </LazyWrapper>
);

export const LazyCouponFormWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>优惠券表单</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyCouponForm {...props} />
    </LazyWrapper>
);

export const LazyContentPageFormWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>内容页面表单</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyContentPageForm {...props} />
    </LazyWrapper>
);

export const LazyAdminResourceTableWrapper = (props: any) => (
    <LazyWrapper fallback={<TableSkeleton />}>
        <LazyAdminResourceTable {...props} />
    </LazyWrapper>
);

export const LazyAdminResourceFormWrapper = (props: any) => (
    <LazyWrapper
        fallback={
            <Card>
                <CardHeader>
                    <CardTitle>资源表单</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </CardContent>
            </Card>
        }
    >
        <LazyAdminResourceForm {...props} />
    </LazyWrapper>
);

// 组件预取函数
export function prefetchComponent(componentName: string): void {
    // 在用户空闲时预取组件
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            switch (componentName) {
                case 'UserDetail':
                    import('@/modules/admin/users/components/user-detail.client');
                    break;
                case 'UsersList':
                    import('@/modules/admin/users/components/users-list-client');
                    break;
                case 'TodoForm':
                    import('@/modules/admin/todos/components/todo-form');
                    break;
                case 'ProductForm':
                    import('@/modules/admin/catalog/components/product-form');
                    break;
                case 'CouponForm':
                    import('@/modules/admin/catalog/components/coupon-form');
                    break;
                case 'ContentPageForm':
                    import('@/modules/admin/catalog/components/content-page-form');
                    break;
                case 'AdminResourceTable':
                    import('@/modules/admin/components/admin-resource-table');
                    break;
                case 'AdminResourceForm':
                    import('@/modules/admin/components/admin-resource-form');
                    break;
            }
        });
    }
}

// 批量预取常用组件
export function prefetchCommonComponents(): void {
    const commonComponents = [
        'UserDetail',
        'UsersList',
        'AdminResourceTable',
    ];

    commonComponents.forEach(component => {
        prefetchComponent(component);
    });
}

// 导出骨架屏组件，供其他地方使用
export { TableSkeleton, CardSkeleton, ChartSkeleton };

// 组件加载状态管理
export class ComponentLoadingManager {
    private static instance: ComponentLoadingManager;
    private loadingComponents: Set<string> = new Set();
    private listeners: Map<string, Array<(loading: boolean) => void>> = new Map();

    static getInstance(): ComponentLoadingManager {
        if (!ComponentLoadingManager.instance) {
            ComponentLoadingManager.instance = new ComponentLoadingManager();
        }
        return ComponentLoadingManager.instance;
    }

    setLoading(componentName: string, loading: boolean): void {
        if (loading) {
            this.loadingComponents.add(componentName);
        } else {
            this.loadingComponents.delete(componentName);
        }

        const listeners = this.listeners.get(componentName) || [];
        listeners.forEach(listener => listener(loading));
    }

    isLoading(componentName: string): boolean {
        return this.loadingComponents.has(componentName);
    }

    subscribe(componentName: string, listener: (loading: boolean) => void): () => void {
        if (!this.listeners.has(componentName)) {
            this.listeners.set(componentName, []);
        }
        this.listeners.get(componentName)!.push(listener);

        // 返回取消订阅函数
        return () => {
            const listeners = this.listeners.get(componentName);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }
}

export const componentLoadingManager = ComponentLoadingManager.getInstance();