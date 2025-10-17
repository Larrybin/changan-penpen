"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/page-header";
import type { CrudFilter } from "@/lib/crud/types";
import { adminQueryKeys } from "@/lib/query/keys";
import {
    createAdminRecord,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import {
    AdminTodoForm,
    type AdminTodoFormValues,
} from "@/modules/admin/todos/components/todo-form";

export default function AdminTodoCreatePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [tenantId, setTenantId] = useState("");
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
    const categoriesQuery = useQuery({
        queryKey: adminQueryKeys.list("categories", {
            pagination: { pageSize: 100 },
            filters: categoryFilters,
            meta: normalizedTenantId
                ? { tenantId: normalizedTenantId }
                : undefined,
        }),
        queryFn: ({ signal }) =>
            fetchAdminList({
                resource: "categories",
                pagination: { pageSize: 100 },
                filters: categoryFilters,
                signal,
            }),
        enabled: Boolean(normalizedTenantId),
    });

    const categories = categoriesQuery.data?.items ?? [];

    const createMutation = useMutation({
        mutationFn: (values: AdminTodoFormValues) =>
            createAdminRecord({ resource: "todos", variables: values }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("todos"),
            });
            toast.success("Todo 已创建");
            router.push(adminRoutes.todos.list);
        },
    });

    const handleSubmit: ComponentProps<typeof AdminTodoForm>["onSubmit"] = (
        values,
    ) => {
        return createMutation.mutateAsync(values);
    };

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="新建 Todo"
                description="填写任务信息并保存，自动同步到 SaaS 租户数据中。"
            />
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
                loading={createMutation.isPending}
            />
        </div>
    );
}
