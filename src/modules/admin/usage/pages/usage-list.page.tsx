"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { CrudFilter } from "@/lib/crud/types";
import { adminQueryKeys } from "@/lib/query/keys";
import {
    type FetchAdminListResult,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import type { UsageAggregateRecord } from "@/modules/admin/types/resource.types";

const SKELETON_ROW_KEYS = Array.from(
    { length: 6 },
    (_, index) => `usage-skeleton-row-${index}`,
);
const SKELETON_CELL_KEYS = Array.from(
    { length: 5 },
    (_, index) => `usage-skeleton-cell-${index}`,
);

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

    const listQuery = useQuery<FetchAdminListResult<UsageAggregateRecord>>({
        queryKey: adminQueryKeys.list("usage", {
            pagination: { pageSize: 20 },
            filters,
        }),
        queryFn: ({ signal }) =>
            fetchAdminList<UsageAggregateRecord>({
                resource: "usage",
                pagination: { pageSize: 20 },
                filters,
                signal,
            }),
        placeholderData: keepPreviousData,
    });
    const isLoading = listQuery.isLoading || listQuery.isFetching;
    const usage = listQuery.data?.items ?? [];

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
                    <thead className="bg-muted/60 text-left font-semibold text-muted-foreground text-xs uppercase">
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
                            SKELETON_ROW_KEYS.map((rowKey) => (
                                <tr key={rowKey}>
                                    {SKELETON_CELL_KEYS.map((cellKey) => (
                                        <td
                                            key={`${rowKey}-${cellKey}`}
                                            className="px-4 py-3"
                                        >
                                            <Skeleton className="h-5 w-full" />
                                        </td>
                                    ))}
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
                                        <div className="text-muted-foreground text-xs">
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
