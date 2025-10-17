"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CrudFilter } from "@/lib/crud/types";
import { adminQueryKeys } from "@/lib/query/keys";
import { fetchAdminList } from "@/modules/admin/api/resources";
import type { OrderRecord } from "@/modules/admin/types/resource.types";

const formatCurrency = (
    amountCents?: number | null,
    currency?: string | null,
) => {
    const normalizedAmount = typeof amountCents === "number" ? amountCents : 0;
    const code =
        typeof currency === "string" && currency.length > 0 ? currency : "USD";

    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: code,
    }).format(normalizedAmount / 100);
};

const formatDateTime = (value?: string | null) =>
    typeof value === "string" && value.length > 0 ? value.slice(0, 19) : "-";

export function OrdersListPage() {
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

    const listQuery = useQuery({
        queryKey: adminQueryKeys.list("orders", {
            pagination: { pageIndex, pageSize },
            filters,
        }),
        queryFn: ({ signal }) =>
            fetchAdminList<OrderRecord>({
                resource: "orders",
                pagination: { pageIndex, pageSize },
                filters,
                signal,
            }),
        keepPreviousData: true,
    });

    const isLoading = listQuery.isLoading || listQuery.isFetching;
    const orders = listQuery.data?.items ?? [];
    const total = listQuery.data?.total ?? 0;
    const pageCount = Math.ceil(total / pageSize);

    // 定义表格列
    const columns: ColumnDef<OrderRecord>[] = useMemo(
        () => [
            {
                accessorKey: "id",
                header: "订单",
                cell: ({ row }) => (
                    <div className="font-medium">#{row.getValue("id")}</div>
                ),
                meta: {
                    label: "订单",
                },
            } satisfies ColumnDef<OrderRecord>,
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
            } satisfies ColumnDef<OrderRecord>,
            {
                accessorKey: "amountCents",
                header: "金额",
                cell: ({ row }) =>
                    formatCurrency(
                        row.getValue("amountCents"),
                        row.original.currency,
                    ),
                meta: {
                    label: "金额",
                },
            } satisfies ColumnDef<OrderRecord>,
            {
                accessorKey: "status",
                header: "状态",
                cell: ({ row }) => (
                    <span className="capitalize">
                        {row.getValue("status") ?? "-"}
                    </span>
                ),
                meta: {
                    label: "状态",
                },
            } satisfies ColumnDef<OrderRecord>,
            {
                accessorKey: "createdAt",
                header: "创建时间",
                cell: ({ row }) => {
                    const date = row.getValue("createdAt") as string;
                    return (
                        <div className="text-xs text-muted-foreground">
                            {formatDateTime(date)}
                        </div>
                    );
                },
                meta: {
                    label: "创建时间",
                },
            } satisfies ColumnDef<OrderRecord>,
        ],
        [],
    );

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="订单与营收"
                description="按租户查看订单流水与金额。"
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
                data={orders}
                isLoading={isLoading}
                itemNameSingular="订单"
                itemNamePlural="订单"
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
