"use client";

import { useOne } from "@refinedev/core";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface TenantDetailPageProps {
    id: string;
}

type TenantSubscription = { status: string | null };
type TenantCreditsEntry = {
    id: string;
    amount: number;
    type: string | null;
    createdAt: string | null;
};
type TenantUsageEntry = {
    date: string;
    total: number;
    unit: string | null;
    feature?: string | null;
};
type TenantDetail = {
    id: string;
    email: string;
    name?: string | null;
    createdAt?: string;
    lastSignIn?: string | null;
    credits?: number;
    subscriptions?: TenantSubscription[];
    creditsHistory?: TenantCreditsEntry[];
    usage?: TenantUsageEntry[];
};

export function TenantDetailPage({ id }: TenantDetailPageProps) {
    const { query, result } = useOne<TenantDetail>({
        resource: "tenants",
        id,
    });
    const isLoading = query.isLoading;
    const tenant = result?.data;

    const breadcrumbs = [
        { label: "Admin", href: adminRoutes.dashboard.overview },
        { label: "租户总览", href: adminRoutes.tenants.list },
    ] as const;

    if (isLoading) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="租户详情"
                    description="查看租户订阅、积分与用量信息。"
                    breadcrumbs={[...breadcrumbs, { label: "加载中" }]}
                    actions={
                        <Button variant="outline" disabled>
                            返回列表
                        </Button>
                    }
                />

                <section className="grid gap-4 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={`tenant-stat-skeleton-${index}`}
                            className="rounded-lg border p-4"
                        >
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="mt-3 h-7 w-24" />
                        </div>
                    ))}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    {["积分流水", "近期用量"].map((title) => (
                        <div key={title} className="rounded-lg border">
                            <div className="border-b px-4 py-3">
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="p-4">
                                {Array.from({ length: 4 }).map(
                                    (_, rowIndex) => (
                                        <Skeleton
                                            key={`${title}-skeleton-row-${rowIndex}`}
                                            className="mb-2 h-5 w-full last:mb-0"
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="租户详情"
                    description="查看租户订阅、积分与用量信息。"
                    breadcrumbs={[...breadcrumbs, { label: "未找到租户" }]}
                    actions={
                        <Button asChild variant="outline">
                            <Link href={adminRoutes.tenants.list}>
                                返回列表
                            </Link>
                        </Button>
                    }
                />
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    未找到该租户。
                </div>
            </div>
        );
    }

    const pageTitle = tenant.email ?? tenant.name ?? tenant.id;

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title={pageTitle}
                description={`用户 ID：${tenant.id}`}
                breadcrumbs={[...breadcrumbs, { label: pageTitle }]}
                actions={
                    <Button asChild variant="outline">
                        <Link href={adminRoutes.tenants.list}>返回列表</Link>
                    </Button>
                }
            />

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                        积分
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                        {tenant.credits}
                    </p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                        最近订阅状态
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                        {tenant.subscriptions?.[0]?.status ?? "无订阅"}
                    </p>
                </div>
                <div className="rounded-lg border p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                        最近一次登录
                    </p>
                    <p className="mt-2 text-sm font-medium">
                        {tenant.lastSignIn?.slice(0, 19) ?? "-"}
                    </p>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">积分流水</h2>
                    </div>
                    <div className="overflow-x-auto px-4 py-3">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="py-2 pr-4">时间</th>
                                    <th className="py-2 pr-4">类型</th>
                                    <th className="py-2 pr-4">数量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(tenant.creditsHistory ?? []).map((entry) => (
                                    <tr key={entry.id} className="border-t">
                                        <td className="py-2 pr-4">
                                            {entry.createdAt?.slice(0, 19)}
                                        </td>
                                        <td className="py-2 pr-4 uppercase">
                                            {entry.type ?? "-"}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {entry.amount}
                                        </td>
                                    </tr>
                                ))}
                                {!tenant.creditsHistory?.length && (
                                    <tr>
                                        <td
                                            className="py-4 text-center text-muted-foreground"
                                            colSpan={3}
                                        >
                                            暂无记录
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">近期用量</h2>
                    </div>
                    <div className="overflow-x-auto px-4 py-3">
                        <table className="min-w-full text-sm">
                            <thead className="text-left text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="py-2 pr-4">日期</th>
                                    <th className="py-2 pr-4">数值</th>
                                    <th className="py-2 pr-4">单位</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(tenant.usage ?? []).map((item) => (
                                    <tr
                                        key={`${item.date}-${item.feature}`}
                                        className="border-t"
                                    >
                                        <td className="py-2 pr-4">
                                            {item.date}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {item.total}
                                        </td>
                                        <td className="py-2 pr-4 uppercase">
                                            {item.unit ?? "-"}
                                        </td>
                                    </tr>
                                ))}
                                {!tenant.usage?.length && (
                                    <tr>
                                        <td
                                            className="py-4 text-center text-muted-foreground"
                                            colSpan={3}
                                        >
                                            暂无记录
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
