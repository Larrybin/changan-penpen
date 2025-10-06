"use client";

import { type CrudFilter, useCreate, useList } from "@refinedev/core";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import { AdminTodoForm } from "@/modules/admin/todos/components/todo-form";

export default function AdminTodoCreatePage() {
    const router = useRouter();
    const [tenantId, setTenantId] = useState("");
    const { mutate } = useCreate();
    const normalizedTenantId = tenantId.trim();
    const categoryFilters: CrudFilter[] = normalizedTenantId
        ? [
              {
                  field: "tenantId",
                  operator: "eq",
                  value: normalizedTenantId,
              },
          ]
        : [];
    const { result: categoriesResult } = useList({
        resource: "categories",
        pagination: {
            pageSize: 100,
        },
        filters: categoryFilters,
        queryOptions: {
            enabled: Boolean(normalizedTenantId),
        },
    });

    const categories = categoriesResult?.data ?? [];

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
                submitLabel="创建"
                categories={categories
                    .filter((c) => typeof c.id === "number")
                    .map((category) => ({
                        id: category.id as number,
                        name: String(category.name ?? ""),
                    }))}
                onTenantChange={setTenantId}
            />
        </div>
    );
}
