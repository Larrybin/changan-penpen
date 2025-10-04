"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useList, useCreate } from "@refinedev/core";
import { AdminTodoForm } from "@/modules/admin/todos/components/todo-form";
import adminRoutes from "@/modules/admin/routes/admin.routes";

export default function AdminTodoCreatePage() {
    const router = useRouter();
    const [tenantId, setTenantId] = useState("");
    const { mutate, isLoading } = useCreate();
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

    const categories = categoriesData?.data ?? [];

    const handleSubmit: ComponentProps<typeof AdminTodoForm>["onSubmit"] = (
        values,
    ) => {
        mutate(
            {
                resource: "todos",
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
                <h1 className="text-2xl font-semibold">新建 Todo</h1>
                <p className="text-sm text-muted-foreground">
                    填写任务信息并保存，自动同步到 SaaS 租户数据中。
                </p>
            </div>
            <AdminTodoForm
                onSubmit={handleSubmit}
                loading={isLoading}
                submitLabel="创建"
                categories={categories.map((category) => ({
                    id: category.id,
                    name: category.name,
                }))}
                onTenantChange={setTenantId}
            />
        </div>
    );
}
