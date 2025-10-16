"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { UsageAggregateRecord } from "@/modules/admin/types/resource.types";

export function UsageListPage() {
    const [tenantId, setTenantId] = useState("");
    const [feature, setFeature] = useState("");
    const filters: CrudFilter[] = useMemo(() => {
        const list: CrudFilter[] = [];
        if (tenantId) {
            list.push({ field: "tenantId", operator: "eq", value: tenantId });
        }
        if (feature) {
            list.push({ field: "feature", operator: "eq", value: feature });
        }
        return list;
    }, [tenantId, feature]);

    const { query, result } = useList<UsageAggregateRecord>({
        resource: "usage",
        pagination: {
            pageSize: 20,
        },
        filters,
    });
    const isLoading = query.isLoading;
    const usage = result?.data ?? [];
    const skeletonRows = Array.from({ length: 6 });

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="用量监控"
                description="按功能与租户查看每日聚合的使用量。"
                actions={
                    <form
                        className="flex w-full flex-col gap-2 md:w-auto md:flex-row"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="租户 ID"
                            value={tenantId}
                            onChange={(event) =>
                                setTenantId(event.target.value)
                            }
                        />
                        <Input
                            placeholder="功能标识"
                            value={feature}
                            onChange={(event) => setFeature(event.target.value)}
                        />
                        <Button type="submit" variant="outline">
                            筛选
                        </Button>
                    </form>
                }
            />
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">日期</th>
                            <th className="px-4 py-3">租户</th>
                            <th className="px-4 py-3">功能</th>
                            <th className="px-4 py-3">总量</th>
                            <th className="px-4 py-3">单位</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading &&
                            skeletonRows.map((_, rowIndex) => (
                                <tr key={`usage-skeleton-${rowIndex}`}>
                                    {Array.from({ length: 5 }).map(
                                        (_, cellIndex) => (
                                            <td
                                                key={`usage-skeleton-cell-${rowIndex}-${cellIndex}`}
                                                className="px-4 py-3"
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </td>
                                        ),
                                    )}
                                </tr>
                            ))}
                        {!isLoading && usage.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无用量数据。
                                </td>
                            </tr>
                        )}
                        {usage.map((item) => {
                            const key = [
                                item.userId ?? "unknown-user",
                                item.date ?? "unknown-date",
                                item.feature ?? "unknown-feature",
                            ].join("-");

                            return (
                                <tr key={key} className="border-t">
                                    <td className="px-4 py-3">
                                        {item.date ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{item.email ?? "-"}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.userId ?? "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.feature ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.totalAmount ?? 0}
                                    </td>
                                    <td className="px-4 py-3 uppercase">
                                        {item.unit ?? "-"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
