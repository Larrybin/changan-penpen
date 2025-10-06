"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OrdersListPage() {
    const [tenantId, setTenantId] = useState("");
    const filters: CrudFilter[] = useMemo(
        () =>
            tenantId
                ? [
                      {
                          field: "tenantId",
                          operator: "eq",
                          value: tenantId,
                      },
                  ]
                : [],
        [tenantId],
    );
    const { query, result } = useList({
        resource: "orders",
        pagination: {
            pageSize: 20,
        },
        filters,
    });
    const isLoading = query.isLoading;
    const orders = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">订单与营收</h1>
                    <p className="text-sm text-muted-foreground">
                        按租户查看订单流水与金额。
                    </p>
                </div>
                <form
                    className="flex w-full gap-2 md:w-auto"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <Input
                        placeholder="按租户 ID 过滤"
                        value={tenantId}
                        onChange={(event) => setTenantId(event.target.value)}
                    />
                    <Button type="submit" variant="outline">
                        筛选
                    </Button>
                </form>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">订单</th>
                            <th className="px-4 py-3">租户</th>
                            <th className="px-4 py-3">金额</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3">创建时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
                        {!isLoading && orders.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无订单数据。
                                </td>
                            </tr>
                        )}
                        {orders.map((order) => (
                            <tr key={order.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    #{order.id}
                                </td>
                                <td className="px-4 py-3">
                                    <div>{order.customerEmail ?? "-"}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {order.userId}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {new Intl.NumberFormat("zh-CN", {
                                        style: "currency",
                                        currency: order.currency ?? "USD",
                                    }).format((order.amountCents ?? 0) / 100)}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {order.status ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {order.createdAt?.slice(0, 19)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
