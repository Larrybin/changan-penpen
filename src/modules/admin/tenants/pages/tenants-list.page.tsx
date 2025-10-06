"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { TenantSummaryRecord } from "@/modules/admin/types/resource.types";

export function TenantsListPage() {
    const [search, setSearch] = useState("");
    const filters: CrudFilter[] = useMemo(
        () =>
            search
                ? [
                      {
                          field: "search",
                          operator: "contains",
                          value: search,
                      },
                  ]
                : [],
        [search],
    );

    const { query, result } = useList<TenantSummaryRecord>({
        resource: "tenants",
        pagination: {
            pageSize: 20,
        },
        filters,
    });
    const isLoading = query.isLoading;
    const tenants = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">租户总览</h1>
                    <p className="text-sm text-muted-foreground">
                        查看所有注册用户的订阅、积分与用量情况。
                    </p>
                </div>
                <form
                    className="flex w-full gap-2 md:w-auto"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <Input
                        placeholder="搜索邮箱或名称"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Button type="submit" variant="outline">
                        搜索
                    </Button>
                </form>
            </div>

            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">租户</th>
                            <th className="px-4 py-3">积分</th>
                            <th className="px-4 py-3">订阅</th>
                            <th className="px-4 py-3">订单数</th>
                            <th className="px-4 py-3">营收</th>
                            <th className="px-4 py-3">用量</th>
                            <th className="px-4 py-3">创建时间</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
                        {!isLoading && tenants.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无租户数据。
                                </td>
                            </tr>
                        )}
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="border-t">
                                <td className="px-4 py-3">
                                    <div className="font-medium">
                                        {tenant.email ?? "-"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {tenant.name ?? tenant.id}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {tenant.credits ?? 0}
                                </td>
                                <td className="px-4 py-3">
                                    {tenant.subscriptionStatus ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {tenant.ordersCount ?? 0}
                                </td>
                                <td className="px-4 py-3">
                                    {formatRevenue(tenant.revenueCents)}
                                </td>
                                <td className="px-4 py-3">
                                    {tenant.totalUsage ?? 0}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {tenant.createdAt?.slice(0, 10) ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link
                                            href={adminRoutes.tenants.show(
                                                String(tenant.id),
                                            )}
                                        >
                                            查看
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function formatRevenue(cents?: number | null) {
    const amount = typeof cents === "number" ? cents : 0;

    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "USD",
    }).format(amount / 100);
}
