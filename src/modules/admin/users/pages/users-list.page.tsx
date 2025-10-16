"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminUserListItem } from "@/modules/admin/users/models";

const INITIAL_PAGE_SIZE = 20;

export function UsersListPage() {
    const [search, setSearch] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);

    const filters: CrudFilter[] = useMemo(() => {
        if (!search.trim()) {
            return [];
        }

        return [
            {
                field: "email",
                operator: "contains",
                value: search.trim(),
            },
        ];
    }, [search]);

    useEffect(() => {
        setPageIndex(0);
    }, []);

    const { query, result } = useList<AdminUserListItem>({
        resource: "users",
        pagination: {
            current: pageIndex + 1,
            pageSize,
        },
        filters,
    });

    const users = result?.data ?? [];
    const total = result?.total ?? users.length;
    const rawPageCount = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
    const pageCount = Math.max(rawPageCount, 1);

    useEffect(() => {
        const maxIndex = Math.max(pageCount - 1, 0);
        if (pageIndex > maxIndex) {
            setPageIndex(maxIndex);
        }
    }, [pageIndex, pageCount]);

    const isError = Boolean(query.error);
    const isLoading = query.isLoading || query.isFetching;

    const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
        () => [
            {
                accessorKey: "email",
                header: "邮箱",
                meta: { label: "邮箱" },
                cell: ({ row }) => (
                    <span className="font-medium text-foreground">
                        {row.original.email}
                    </span>
                ),
            },
            {
                accessorKey: "name",
                header: "姓名",
                meta: { label: "姓名" },
                cell: ({ row }) =>
                    row.original.name ? (
                        row.original.name
                    ) : (
                        <span className="text-muted-foreground">未填写</span>
                    ),
            },
            {
                accessorKey: "role",
                header: "角色",
                meta: { label: "角色" },
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.role === "admin"
                                ? "default"
                                : "secondary"
                        }
                    >
                        {row.original.role === "admin" ? "管理员" : "普通用户"}
                    </Badge>
                ),
            },
            {
                accessorKey: "status",
                header: "状态",
                meta: { label: "状态" },
                cell: ({ row }) => (
                    <Badge
                        variant={
                            row.original.status === "active"
                                ? "default"
                                : "outline"
                        }
                    >
                        {row.original.status === "active" ? "已验证" : "待验证"}
                    </Badge>
                ),
            },
            {
                accessorKey: "credits",
                header: "积分",
                meta: { label: "积分" },
                cell: ({ row }) => (
                    <span>{row.original.credits.toLocaleString()}</span>
                ),
            },
            {
                accessorKey: "createdAt",
                header: "创建时间",
                meta: { label: "创建时间" },
                cell: ({ row }) =>
                    row.original.createdAt
                        ? format(
                              new Date(row.original.createdAt),
                              "yyyy-MM-dd HH:mm",
                          )
                        : "-",
            },
            {
                id: "actions",
                header: "",
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button asChild size="sm" variant="ghost">
                            <Link
                                href={adminRoutes.users.show(row.original.id)}
                            >
                                查看
                            </Link>
                        </Button>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="用户管理"
                description="浏览、筛选并查看所有注册用户的资料。"
                breadcrumbs={[
                    { label: "Admin", href: adminRoutes.dashboard.overview },
                    { label: "用户管理" },
                ]}
                actions={
                    <form
                        className="flex w-full gap-2 md:w-auto"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <Input
                            placeholder="按邮箱筛选"
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
                data={users}
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={(nextPage) => {
                    const maxIndex = Math.max(pageCount - 1, 0);
                    const clamped = Math.min(Math.max(nextPage, 0), maxIndex);
                    setPageIndex(clamped);
                }}
                onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize);
                    setPageIndex(0);
                }}
                totalCount={total}
                itemNameSingular="用户"
                itemNamePlural="用户"
                isLoading={isLoading}
                emptyState={
                    isError
                        ? "获取用户数据失败，请稍后再试。"
                        : "暂无用户数据。"
                }
                skeletonRowCount={Math.min(pageSize, 5)}
                getRowHref={(row) => adminRoutes.users.show(row.id)}
            />
        </div>
    );
}
