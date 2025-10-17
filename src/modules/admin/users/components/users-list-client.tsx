"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import type { FormEvent } from "react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/data/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminUserListItem } from "@/modules/admin/users/models";

interface UsersListClientProps {
    data: AdminUserListItem[];
    total: number;
    page: number;
    perPage: number;
    searchQuery?: string;
}

export function UsersListClient({
    data,
    total,
    page,
    perPage,
    searchQuery = "",
}: UsersListClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchQuery);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setSearch(searchQuery);
    }, [searchQuery]);

    const updateQuery = useCallback(
        (updates: Record<string, string | null>) => {
            const current = new URLSearchParams(searchParams?.toString() ?? "");
            for (const [key, value] of Object.entries(updates)) {
                if (!value) {
                    current.delete(key);
                } else {
                    current.set(key, value);
                }
            }
            const queryString = current.toString();
            startTransition(() => {
                router.push(queryString ? `${pathname}?${queryString}` : pathname, {
                    scroll: false,
                });
            });
        },
        [pathname, router, searchParams],
    );

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const trimmed = search.trim();
            updateQuery({ email: trimmed || null, page: "1" });
        },
        [search, updateQuery],
    );

    const safePerPage = Math.max(perPage, 1);
    const computedPageCount = safePerPage > 0 ? Math.ceil(total / safePerPage) : 0;
    const pageCount = Math.max(computedPageCount, 1);
    const maxIndex = Math.max(pageCount - 1, 0);
    const pageIndex = Math.min(Math.max(page - 1, 0), maxIndex);
    const skeletonRowCount = Math.max(1, Math.min(safePerPage, 5));

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
                        variant={row.original.role === "admin" ? "default" : "secondary"}
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
                        variant={row.original.status === "active" ? "default" : "outline"}
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
                        ? format(new Date(row.original.createdAt), "yyyy-MM-dd HH:mm")
                        : "-",
            },
            {
                id: "actions",
                header: "",
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Button asChild size="sm" variant="ghost">
                            <Link href={adminRoutes.users.show(row.original.id)}>
                                查看
                            </Link>
                        </Button>
                    </div>
                ),
            },
        ],
        [],
    );

    const handlePageChange = useCallback(
        (nextIndex: number) => {
            const nextPage = Math.max(1, nextIndex + 1);
            updateQuery({ page: `${nextPage}` });
        },
        [updateQuery],
    );

    const handlePageSizeChange = useCallback(
        (nextSize: number) => {
            updateQuery({ perPage: `${nextSize}`, page: "1" });
        },
        [updateQuery],
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
                        onSubmit={handleSubmit}
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
                data={data}
                pageCount={pageCount}
                pageIndex={pageIndex}
                pageSize={safePerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={total}
                itemNameSingular="用户"
                itemNamePlural="用户"
                isLoading={isPending}
                emptyState="暂无用户数据。"
                skeletonRowCount={skeletonRowCount}
                getRowHref={(row) => adminRoutes.users.show(row.id)}
            />
        </div>
    );
}
