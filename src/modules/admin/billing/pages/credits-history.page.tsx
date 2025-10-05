"use client";

import { useList, type CrudFilter } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreditsHistoryPage() {
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
        resource: "credits-history",
        pagination: {
            pageSize: 20,
        },
        filters,
    });
    const isLoading = query.isLoading;
    const entries = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">积分流水</h1>
                    <p className="text-sm text-muted-foreground">
                        追踪积分增减，支持按租户筛选。
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
                            <th className="px-4 py-3">记录</th>
                            <th className="px-4 py-3">租户</th>
                            <th className="px-4 py-3">类型</th>
                            <th className="px-4 py-3">积分</th>
                            <th className="px-4 py-3">备注</th>
                            <th className="px-4 py-3">时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
                        {!isLoading && entries.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无积分记录。
                                </td>
                            </tr>
                        )}
                        {entries.map((entry) => (
                            <tr key={entry.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    #{entry.id}
                                </td>
                                <td className="px-4 py-3">
                                    <div>{entry.customerEmail ?? "-"}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {entry.userId}
                                    </div>
                                </td>
                                <td className="px-4 py-3 uppercase">
                                    {entry.type ?? "-"}
                                </td>
                                <td className="px-4 py-3">{entry.amount}</td>
                                <td className="px-4 py-3">
                                    {entry.description ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {entry.createdAt?.slice(0, 19)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
