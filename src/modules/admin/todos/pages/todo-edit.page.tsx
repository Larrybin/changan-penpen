"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import type { CrudFilter } from "@/lib/crud/types";
import { adminQueryKeys } from "@/lib/query/keys";
import { toast } from "@/lib/toast";
import {
    fetchAdminList,
    fetchAdminRecord,
    updateAdminRecord,
} from "@/modules/admin/api/resources";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import {
    AdminTodoForm,
    type AdminTodoFormValues,
} from "@/modules/admin/todos/components/todo-form";
import type {
    AdminTodoRecord,
    TodoCategoryRecord,
} from "@/modules/admin/types/resource.types";

interface AdminTodoEditPageProps {
    id: string;
}

export default function AdminTodoEditPage({ id }: AdminTodoEditPageProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const todoId = Number.parseInt(id, 10);

    const todoQuery = useQuery({
        queryKey: adminQueryKeys.detail("todos", todoId),
        queryFn: ({ signal }) =>
            fetchAdminRecord<AdminTodoRecord>({
                resource: "todos",
                id: todoId,
                signal,
            }),
        enabled: !Number.isNaN(todoId),
    });

    const record = todoQuery.data ?? undefined;
    const tenantId = typeof record?.userId === "string" ? record.userId : "";
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
            fetchAdminList<TodoCategoryRecord>({
                resource: "categories",
                pagination: { pageSize: 100 },
                filters: categoryFilters,
                signal,
            }),
        enabled: Boolean(normalizedTenantId),
    });

    const updateMutation = useMutation({
        mutationFn: (values: AdminTodoFormValues) =>
            updateAdminRecord({
                resource: "todos",
                id: todoId,
                variables: values,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("todos"),
            });
            toast.success("Todo 已更新");
            router.push(adminRoutes.todos.list);
        },
    });

    if (Number.isNaN(todoId)) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                无效的 Todo ID
            </div>
        );
    }

    const isLoading = todoQuery.isLoading;
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
            </div>
        );
    }

    if (!record) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                未找到对应的 Todo
            </div>
        );
    }

    const handleSubmit: ComponentProps<typeof AdminTodoForm>["onSubmit"] = (
        values,
    ) => updateMutation.mutateAsync(values).then(() => undefined);

    const initialValues: Partial<AdminTodoFormValues> = {
        userId: typeof record.userId === "string" ? record.userId : "",
        title: record.title ?? "",
        description: record.description ?? "",
        categoryId:
            typeof record.categoryId === "number"
                ? record.categoryId
                : undefined,
        status: record.status ?? undefined,
        priority: record.priority ?? undefined,
        imageUrl: record.imageUrl ?? "",
        imageAlt: record.imageAlt ?? "",
        completed: record.completed ?? false,
        dueDate: record.dueDate ?? undefined,
    } satisfies Partial<ComponentProps<typeof AdminTodoForm>["initialValues"]>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">编辑 Todo</h1>
                <p className="text-sm text-muted-foreground">
                    调整任务信息，保存后立即生效。
                </p>
            </div>
            <AdminTodoForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                submitLabel="保存修改"
                categories={(categoriesQuery.data?.items ?? [])
                    .filter((category) => typeof category.id === "number")
                    .map((category) => ({
                        id: category.id as number,
                        name: String(category.name ?? ""),
                    }))}
                disableTenantSelection
                tenantEmail={record.userEmail ?? null}
                loading={updateMutation.isPending}
            />
        </div>
    );
}
