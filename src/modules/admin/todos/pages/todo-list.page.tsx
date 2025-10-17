"use client";

import type { CrudFilter } from "@refinedev/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueryKeys } from "@/lib/query/keys";
import {
    deleteAdminRecord,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminTodoRecord } from "@/modules/admin/types/resource.types";

const TODO_SKELETON_ROW_KEYS = Array.from(
    { length: 6 },
    (_, index) => `todo-list-skeleton-row-${index}`,
);
const TODO_SKELETON_CELL_KEYS = Array.from(
    { length: 7 },
    (_, index) => `todo-list-skeleton-cell-${index}`,
);

export default function AdminTodoListPage() {
    const [tenantFilter, setTenantFilter] = useState("");
    const normalizedFilter = tenantFilter.trim();
    const filters: CrudFilter[] = normalizedFilter
        ? [
              {
                  field: "tenantId",
                  operator: "eq",
                  value: normalizedFilter,
              },
          ]
        : [];
    const queryClient = useQueryClient();
    const listQuery = useQuery({
        queryKey: adminQueryKeys.list("todos", {
            pagination: { pageSize: 20 },
            filters,
        }),
        queryFn: ({ signal }) =>
            fetchAdminList<AdminTodoRecord>({
                resource: "todos",
                pagination: { pageSize: 20 },
                filters,
                signal,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (todoId: number) =>
            deleteAdminRecord({ resource: "todos", id: todoId }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("todos"),
            });
            toast.success("Todo 已删除");
        },
    });

    const isLoading = listQuery.isLoading || listQuery.isFetching;
    const todos = listQuery.data?.items ?? [];
    const total = listQuery.data?.total ?? 0;

    const formatter = useMemo(() => {
        return new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    }, []);

    const handleDelete = (id: number) => {
        // eslint-disable-next-line no-alert
        const confirmed = window.confirm("确定要删除该 Todo 吗？");
        if (!confirmed) return;

        deleteMutation.mutate(id);
    };

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="Todo 列表"
                description="查看、编辑并快速管理 SaaS 租户的任务数据。"
                actions={
                    <Link href={adminRoutes.todos.create}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> 新建 Todo
                        </Button>
                    </Link>
                }
            />

            <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle>全部任务</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            共 {total} 条记录
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            value={tenantFilter}
                            onChange={(event) =>
                                setTenantFilter(event.target.value)
                            }
                            placeholder="按租户 ID 过滤"
                            className="w-full sm:w-[220px]"
                        />
                        {tenantFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTenantFilter("")}
                            >
                                清除
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        {[
                                            "标题",
                                            "所属租户",
                                            "分类",
                                            "状态",
                                            "优先级",
                                            "截止日期",
                                            "操作",
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-4 py-3 font-medium"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TODO_SKELETON_ROW_KEYS.map((rowKey) => (
                                        <tr key={rowKey}>
                                            {TODO_SKELETON_CELL_KEYS.map(
                                                (cellKey) => (
                                                    <td
                                                        key={`${rowKey}-${cellKey}`}
                                                        className="px-4 py-3"
                                                    >
                                                        <Skeleton className="h-5 w-full" />
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : todos.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            {normalizedFilter
                                ? "未找到匹配该租户的任务，请检查租户 ID。"
                                : "暂无数据，点击右上角按钮新建任务。"}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="px-4 py-3 font-medium">
                                            标题
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            租户
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            分类
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            状态
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            优先级
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            截止时间
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todos.map((todo) => (
                                        <tr
                                            key={todo.id}
                                            className="border-b border-border/60 last:border-none"
                                        >
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {todo.title ?? "-"}
                                                {todo.completed && (
                                                    <span className="ml-2 text-xs text-green-600">
                                                        已完成
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {todo.userEmail ?? "-"}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {todo.userId ?? "-"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {todo.categoryName ?? "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">
                                                    {todo.status ?? "-"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {todo.priority ?? "-"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {typeof todo.dueDate ===
                                                    "string" && todo.dueDate
                                                    ? formatter.format(
                                                          new Date(
                                                              todo.dueDate,
                                                          ),
                                                      )
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={adminRoutes.todos.edit(
                                                            Number(todo.id),
                                                        )}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            handleDelete(
                                                                Number(todo.id),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
