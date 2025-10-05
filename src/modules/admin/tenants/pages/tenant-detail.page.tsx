"use client";

import { useOne } from "@refinedev/core";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface TenantDetailPageProps {
    id: string;
}

export function TenantDetailPage({ id }: TenantDetailPageProps) {
    const { query, result } = useOne({ resource: "tenants", id });
    const isLoading = query.isLoading;
    const tenant = result?.data;

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    if (!tenant) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">未找到该租户。</p>
                <Button asChild variant="outline">
                    <Link href={adminRoutes.tenants.list}>返回列表</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{tenant.email}</h1>
                    <p className="text-sm text-muted-foreground">
                        用户 ID：{tenant.id}
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={adminRoutes.tenants.list}>返回列表</Link>
                </Button>
            </div>

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
                                {(tenant.creditsHistory ?? []).map(
                                    (entry: any) => (
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
                                    ),
                                )}
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
                                {(tenant.usage ?? []).map((item: any) => (
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
