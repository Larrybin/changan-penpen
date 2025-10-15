"use client";

import { type CrudFilter, useList } from "@refinedev/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminUserListItem } from "@/modules/admin/users/models";

const PAGE_SIZE = 20;

export function UsersListPage() {
    const [search, setSearch] = useState("");

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

    const { query, result } = useList<AdminUserListItem>({
        resource: "users",
        pagination: {
            pageSize: PAGE_SIZE,
        },
        filters,
    });

    const isLoading = query.isLoading;
    const isError = Boolean(query.error);
    const users = result?.data ?? [];
    const total = result?.total ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">用户管理</h1>
                    <p className="text-sm text-muted-foreground">
                        浏览、筛选并查看所有注册用户的资料。
                    </p>
                </div>
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
            </div>

            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">邮箱</th>
                            <th className="px-4 py-3">姓名</th>
                            <th className="px-4 py-3">角色</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3">积分</th>
                            <th className="px-4 py-3">创建时间</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}

                        {isError && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-destructive"
                                >
                                    获取用户数据失败，请稍后再试。
                                </td>
                            </tr>
                        )}

                        {!isLoading && !isError && users.length === 0 && (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无用户数据。
                                </td>
                            </tr>
                        )}

                        {users.map((userItem) => {
                            const createdLabel = userItem.createdAt
                                ? new Date(userItem.createdAt).toLocaleString()
                                : "-";

                            return (
                                <tr key={userItem.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {userItem.email ?? "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {userItem.name ?? "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                userItem.role === "admin"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {userItem.role === "admin"
                                                ? "管理员"
                                                : "普通用户"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                userItem.status === "active"
                                                    ? "default"
                                                    : "outline"
                                            }
                                        >
                                            {userItem.status === "active"
                                                ? "已验证"
                                                : "待验证"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {userItem.credits ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {createdLabel}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="ghost"
                                        >
                                            <Link
                                                href={adminRoutes.users.show(
                                                    String(userItem.id),
                                                )}
                                            >
                                                查看
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="text-xs text-muted-foreground">
                共 {total} 名用户，页面正在接入更多筛选条件。
            </div>
        </div>
    );
}
