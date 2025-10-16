"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { TenantSummaryRecord } from "@/modules/admin/types/resource.types";

export function TenantsListPage() {
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(20);

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
            current: pageIndex + 1,
            pageSize: pageSize,
        },
        filters,
    });

    const isLoading = query.isLoading;
    const tenants = result?.data ?? [];
    const total = result?.total ?? 0;
    const pageCount = Math.ceil(total / pageSize);

    // 定义表格列
    const columns: ColumnDef<TenantSummaryRecord>[] = useMemo(
        () => [
            {
                accessorKey: "email",
                header: "租户",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium">
                            {row.getValue("email") ?? "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.name ?? row.original.id}
                        </div>
                    </div>
                ),
                meta: {
                    label: "租户",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "credits",
                header: "积分",
                cell: ({ row }) => row.getValue("credits") ?? 0,
                meta: {
                    label: "积分",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "subscriptionStatus",
                header: "订阅",
                cell: ({ row }) => row.getValue("subscriptionStatus") ?? "-",
                meta: {
                    label: "订阅",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "ordersCount",
                header: "订单数",
                cell: ({ row }) => row.getValue("ordersCount") ?? 0,
                meta: {
                    label: "订单数",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "revenueCents",
                header: "营收",
                cell: ({ row }) => formatRevenue(row.getValue("revenueCents")),
                meta: {
                    label: "营收",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "totalUsage",
                header: "用量",
                cell: ({ row }) => row.getValue("totalUsage") ?? 0,
                meta: {
                    label: "用量",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                accessorKey: "createdAt",
                header: "创建时间",
                cell: ({ row }) => {
                    const date = row.getValue("createdAt") as string;
                    return date?.slice(0, 10) ?? "-";
                },
                meta: {
                    label: "创建时间",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <Button asChild size="sm" variant="ghost">
                        <Link
                            href={adminRoutes.tenants.show(
                                String(row.original.id),
                            )}
                        >
                            查看
                        </Link>
                    </Button>
                ),
                enableSorting: false,
                meta: {
                    label: "操作",
                },
            } satisfies ColumnDef<TenantSummaryRecord>,
        ],
        [],
    );

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="租户总览"
                description="查看所有注册用户的订阅、积分与用量情况。"
                actions={
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
                }
            />
            <DataTable
                columns={columns}
                data={tenants}
                isLoading={isLoading}
                itemNameSingular="租户"
                itemNamePlural="租户"
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
                getRowHref={(row) => adminRoutes.tenants.show(String(row.id))}
            />
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
