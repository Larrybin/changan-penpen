"use client";

import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useList, useOne, useUpdate } from "@refinedev/core";
import { AdminTodoForm } from "@/modules/admin/todos/components/todo-form";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface AdminTodoEditPageProps {
    id: string;
}

export default function AdminTodoEditPage({ id }: AdminTodoEditPageProps) {
    const router = useRouter();
    const todoId = Number.parseInt(id, 10);

    const { data: todoData, isLoading } = useOne({
        resource: "todos",
        id: todoId,
        queryOptions: {
            enabled: !Number.isNaN(todoId),
        },
    });

    const tenantId = todoData?.data?.userId ?? "";
    const normalizedTenantId = tenantId.trim();
    const { data: categoriesData } = useList({
        resource: "categories",
        pagination: {
            pageSize: 100,
        },
        filters: normalizedTenantId
            ? [
                  {
                      field: "tenantId",
                      operator: "eq",
                      value: normalizedTenantId,
                  },
              ]
            : [],
        queryOptions: {
            enabled: Boolean(normalizedTenantId),
            keepPreviousData: true,
        },
    });

    const { mutate, isLoading: isUpdating } = useUpdate();

    if (Number.isNaN(todoId)) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                无效的 Todo ID
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        );
    }

    const record = todoData?.data;

    if (!record) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                未找到对应的 Todo
            </div>
        );
    }

    const handleSubmit: ComponentProps<typeof AdminTodoForm>["onSubmit"] = (
        values,
    ) => {
        mutate(
            {
                resource: "todos",
                id: todoId,
                values,
            },
            {
                onSuccess: () => {
                    router.push(adminRoutes.todos.list);
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">编辑 Todo</h1>
                <p className="text-sm text-muted-foreground">
                    调整任务信息，保存后立即生效。
                </p>
            </div>
            <AdminTodoForm
                initialValues={record}
                onSubmit={handleSubmit}
                loading={isUpdating}
                submitLabel="保存修改"
                categories={(categoriesData?.data ?? []).map((category) => ({
                    id: category.id,
                    name: category.name,
                }))}
                disableTenantSelection
                tenantEmail={record.userEmail ?? null}
            />
        </div>
    );
}
