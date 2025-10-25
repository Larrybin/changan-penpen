"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
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

function useAdminTodoEditData(id: string) {
    const todoId = Number.parseInt(id, 10);
    const isInvalidId = Number.isNaN(todoId);

    const todoQuery = useQuery({
        queryKey: adminQueryKeys.detail("todos", todoId),
        queryFn: ({ signal }) =>
            fetchAdminRecord<AdminTodoRecord>({
                resource: "todos",
                id: todoId,
                signal,
            }),
        enabled: !isInvalidId,
    });

    const record = todoQuery.data ?? undefined;
    const tenantId =
        typeof record?.userId === "string" ? record.userId.trim() : "";
    const categoryFilters: CrudFilter[] = tenantId
        ? [
              {
                  field: "tenantId",
                  operator: "eq",
                  value: tenantId,
              },
          ]
        : [];

    const categoriesQuery = useQuery({
        queryKey: adminQueryKeys.list("categories", {
            pagination: { pageSize: 100 },
            filters: categoryFilters,
            meta: tenantId ? { tenantId } : undefined,
        }),
        queryFn: ({ signal }) =>
            fetchAdminList<TodoCategoryRecord>({
                resource: "categories",
                pagination: { pageSize: 100 },
                filters: categoryFilters,
                signal,
            }),
        enabled: Boolean(tenantId),
    });

    return { todoId, isInvalidId, todoQuery, record, categoriesQuery };
}

function CenteredPlaceholder({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            {children}
        </div>
    );
}

export default function AdminTodoEditPage({ id }: AdminTodoEditPageProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { todoId, isInvalidId, todoQuery, record, categoriesQuery } =
        useAdminTodoEditData(id);

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

    if (isInvalidId) {
        return <CenteredPlaceholder>无效的 Todo ID</CenteredPlaceholder>;
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
        return <CenteredPlaceholder>未找到对应的 Todo</CenteredPlaceholder>;
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
                <h1 className="font-semibold text-2xl">编辑 Todo</h1>
                <p className="text-muted-foreground text-sm">
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
