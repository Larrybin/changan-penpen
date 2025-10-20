"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrorToForm } from "@/modules/admin/utils/form-errors";
import { TodoPriority, TodoStatus } from "@/modules/todos/models/todo.enum";
import { insertTodoSchema } from "@/modules/todos/schemas/todo.schema";

const formSchema = insertTodoSchema.pick({
    userId: true,
    title: true,
    description: true,
    categoryId: true,
    status: true,
    priority: true,
    imageUrl: true,
    imageAlt: true,
    completed: true,
    dueDate: true,
});

export type AdminTodoFormValues = z.infer<typeof formSchema>;

interface AdminTodoFormProps {
    initialValues?: Partial<AdminTodoFormValues>;
    onSubmit: (values: AdminTodoFormValues) => Promise<void> | void;
    loading?: boolean;
    submitLabel?: string;
    categories: Array<{
        id: number;
        name: string;
    }>;
    onTenantChange?: (tenantId: string) => void;
    disableTenantSelection?: boolean;
    tenantEmail?: string | null;
}

const statusOptions = Object.values(TodoStatus);
const priorityOptions = Object.values(TodoPriority);

export function AdminTodoForm({
    initialValues,
    onSubmit,
    loading,
    submitLabel = "保存",
    categories,
    onTenantChange,
    disableTenantSelection,
    tenantEmail,
}: AdminTodoFormProps) {
    const resolvedInitialValues = useMemo(
        () => ({
            userId: initialValues?.userId ?? "",
            title: initialValues?.title ?? "",
            description: initialValues?.description ?? "",
            categoryId: initialValues?.categoryId ?? undefined,
            status: initialValues?.status ?? TodoStatus.PENDING,
            priority: initialValues?.priority ?? TodoPriority.MEDIUM,
            imageUrl: initialValues?.imageUrl ?? "",
            imageAlt: initialValues?.imageAlt ?? "",
            completed: initialValues?.completed ?? false,
            dueDate: initialValues?.dueDate
                ? initialValues.dueDate.split("T")[0]
                : undefined,
        }),
        [initialValues],
    );

    const form = useForm<AdminTodoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: resolvedInitialValues,
    });

    useEffect(() => {
        if (!initialValues) {
            return;
        }

        form.reset(resolvedInitialValues);

        if (initialValues.userId) {
            onTenantChange?.(initialValues.userId);
        }
    }, [form, initialValues, onTenantChange, resolvedInitialValues]);

    const watchedTenantId = form.watch("userId") ?? "";
    const selectedTenantId = watchedTenantId.trim();
    const submitting = form.formState.isSubmitting;
    const effectiveLoading =
        typeof loading === "boolean" ? loading : submitting;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Todo 表单</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit(async (values) => {
                            const payload: AdminTodoFormValues = {
                                ...values,
                                categoryId:
                                    typeof values.categoryId === "string"
                                        ? Number.parseInt(values.categoryId, 10)
                                        : values.categoryId,
                            };
                            try {
                                await onSubmit(payload);
                            } catch (error) {
                                applyApiErrorToForm(form, error);
                            }
                        })}
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>租户 ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="请输入租户 ID（邮箱或用户编号）"
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    onTenantChange?.(
                                                        e.target.value,
                                                    );
                                                }}
                                                disabled={Boolean(
                                                    disableTenantSelection,
                                                )}
                                            />
                                        </FormControl>
                                        {tenantEmail ? (
                                            <p className="text-xs text-muted-foreground">
                                                当前租户邮箱：{tenantEmail}
                                            </p>
                                        ) : (
                                            <FormDescription>
                                                先填入租户
                                                ID，后续分类选项会自动匹配。
                                            </FormDescription>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分类</FormLabel>
                                        <Select
                                            onValueChange={(val) =>
                                                field.onChange(val)
                                            }
                                            value={
                                                typeof field.value === "number"
                                                    ? String(field.value)
                                                    : (field.value as
                                                          | string
                                                          | undefined)
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择分类" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((c) => (
                                                    <SelectItem
                                                        key={c.id}
                                                        value={String(c.id)}
                                                    >
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>标题</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="请输入标题"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>描述</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="补充任务说明"
                                            className="min-h-24"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>状态</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择状态" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem
                                                        key={option}
                                                        value={option}
                                                    >
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>优先级</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择优先级" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {priorityOptions.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="imageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>封面图 URL</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="https://..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="imageAlt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>封面图描述</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="用于无障碍与 SEO 的文字描述"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="completed"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>标记为已完成</FormLabel>
                                            <FormDescription>
                                                完成后仍可在后台继续编辑或重新打开。
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>截至日期</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                value={field.value ?? ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                type="submit"
                                disabled={effectiveLoading || !selectedTenantId}
                            >
                                {effectiveLoading ? "提交中..." : submitLabel}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
