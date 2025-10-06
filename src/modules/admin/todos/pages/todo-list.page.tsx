"use client";

import { type CrudFilter, useDelete, useList } from "@refinedev/core";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { AdminTodoRecord } from "@/modules/admin/types/resource.types";

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
    const { query, result } = useList<AdminTodoRecord>({
        resource: "todos",
        pagination: {
            pageSize: 20,
        },
        filters,
        queryOptions: {},
    });

    const { mutate: deleteTodo } = useDelete();
    const isLoading = query.isLoading;
    const refetch = query.refetch;
    const todos = result?.data ?? [];
    const total = result?.total ?? 0;

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

        deleteTodo(
            {
                resource: "todos",
                id,
            },
            {
                onSuccess: () => {
                    refetch();
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Todo 列表</h1>
                    <p className="text-sm text-muted-foreground">
                        查看、编辑并快速管理 SaaS 租户的任务数据
                    </p>
                </div>
                <Link href={adminRoutes.todos.create}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新建 Todo
                    </Button>
                </Link>
            </div>

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
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin" />
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
                                                {typeof todo.dueDate === "string" && todo.dueDate
                                                    ? formatter.format(
                                                          new Date(todo.dueDate),
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
