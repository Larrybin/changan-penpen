"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CreditHistoryEntry } from "@/modules/admin/types/resource.types";

const formatDateTime = (value?: string | null) =>
    typeof value === "string" && value.length > 0 ? value.slice(0, 19) : "-";

export function CreditsHistoryPage() {
    const [tenantId, setTenantId] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);

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

    const { query, result } = useList<CreditHistoryEntry>({
        resource: "credits-history",
        pagination: {
            current: pageIndex + 1,
            pageSize: pageSize,
        },
        filters,
    });

    const isLoading = query.isLoading;
    const entries = result?.data ?? [];
    const total = result?.total ?? 0;
    const pageCount = Math.ceil(total / pageSize);

    // 定义表格列
    const columns: ColumnDef<CreditHistoryEntry>[] = useMemo(
        () => [
            {
                accessorKey: "id",
                header: "记录",
                cell: ({ row }) => (
                    <div className="font-medium">#{row.getValue("id")}</div>
                ),
                meta: {
                    label: "记录",
                },
            },
            {
                accessorKey: "customerEmail",
                header: "租户",
                cell: ({ row }) => (
                    <div>
                        <div>{row.getValue("customerEmail") ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.userId ?? "-"}
                        </div>
                    </div>
                ),
                meta: {
                    label: "租户",
                },
            },
            {
                accessorKey: "type",
                header: "类型",
                cell: ({ row }) => (
                    <span className="uppercase">
                        {row.getValue("type") ?? "-"}
                    </span>
                ),
                meta: {
                    label: "类型",
                },
            },
            {
                accessorKey: "amount",
                header: "积分",
                cell: ({ row }) => {
                    const amount = row.getValue("amount") as number;
                    return typeof amount === "number" ? amount : 0;
                },
                meta: {
                    label: "积分",
                },
            },
            {
                accessorKey: "description",
                header: "备注",
                cell: ({ row }) => row.getValue("description") ?? "-",
                meta: {
                    label: "备注",
                },
            },
            {
                accessorKey: "createdAt",
                header: "时间",
                cell: ({ row }) => {
                    const date = row.getValue("createdAt") as string;
                    return (
                        <div className="text-xs text-muted-foreground">
                            {formatDateTime(date)}
                        </div>
                    );
                },
                meta: {
                    label: "时间",
                },
            },
        ],
        [],
    );

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="积分流水"
                description="追踪积分增减，支持按租户筛选。"
                actions={
                    <form
                        className="flex w-full gap-2 md:w-auto"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="按租户 ID 过滤"
                            value={tenantId}
                            onChange={(event) =>
                                setTenantId(event.target.value)
                            }
                        />
                        <Button type="submit" variant="outline">
                            筛选
                        </Button>
                    </form>
                }
            />
            <DataTable
                columns={columns}
                data={entries}
                isLoading={isLoading}
                itemNameSingular="积分记录"
                itemNamePlural="积分记录"
                pageIndex={pageIndex}
                pageSize={pageSize}
                pageCount={pageCount}
                totalCount={total}
                onPageChange={(page) => {
                    setPageIndex(page);
                }}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setPageIndex(0);
                }}
            />
        </div>
    );
}
