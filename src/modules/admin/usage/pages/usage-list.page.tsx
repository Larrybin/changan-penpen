"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    const { query, result } = useList({
        resource: "usage",
        pagination: {
            pageSize: 20,
        },
        filters,
    });
    const isLoading = query.isLoading;
    const usage = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">用量监控</h1>
                    <p className="text-sm text-muted-foreground">
                        按功能与租户查看每日聚合的使用量。
                    </p>
                </div>
                <form
                    className="flex w-full flex-col gap-2 md:w-auto md:flex-row"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <Input
                        placeholder="租户 ID"
                        value={tenantId}
                        onChange={(event) => setTenantId(event.target.value)}
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
            </div>
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
                        {usage.map((item) => (
                            <tr
                                key={`${item.userId}-${item.date}-${item.feature}`}
                                className="border-t"
                            >
                                <td className="px-4 py-3">{item.date}</td>
                                <td className="px-4 py-3">
                                    <div>{item.email ?? "-"}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {item.userId}
                                    </div>
                                </td>
                                <td className="px-4 py-3">{item.feature}</td>
                                <td className="px-4 py-3">
                                    {item.totalAmount}
                                </td>
                                <td className="px-4 py-3 uppercase">
                                    {item.unit ?? "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
