"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
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
    onSubmit: (values: AdminTodoFormValues) => void;
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
    const form = useForm<AdminTodoFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
        },
    });

    useEffect(() => {
        if (initialValues) {
            form.reset({
                userId: initialValues.userId ?? "",
                title: initialValues.title ?? "",
                description: initialValues.description ?? "",
                categoryId: initialValues.categoryId ?? undefined,
                status: initialValues.status ?? TodoStatus.PENDING,
                priority: initialValues.priority ?? TodoPriority.MEDIUM,
                imageUrl: initialValues.imageUrl ?? "",
                imageAlt: initialValues.imageAlt ?? "",
                completed: initialValues.completed ?? false,
                dueDate: initialValues.dueDate
                    ? initialValues.dueDate.split("T")[0]
                    : undefined,
            });

            if (initialValues.userId) {
                onTenantChange?.(initialValues.userId);
            }
        }
    }, [form, initialValues, onTenantChange]);

    const watchedTenantId = form.watch("userId") ?? "";
    const selectedTenantId = watchedTenantId.trim();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Todo 表单</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        className="space-y-6"
                        onSubmit={form.handleSubmit((values) => {
                            const payload: AdminTodoFormValues = {
                                ...values,
                                categoryId:
                                    typeof values.categoryId === "string"
                                        ? Number.parseInt(values.categoryId, 10)
                                        : values.categoryId,
                                dueDate: values.dueDate
                                    ? new Date(values.dueDate).toISOString()
                                    : undefined,
                                imageUrl: values.imageUrl || undefined,
                                imageAlt: values.imageAlt || undefined,
                            };
                            onSubmit(payload);
                        })}
                    >
                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>租户 ID</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="请输入租户 ID（可在租户列表复制）"
                                            {...field}
                                            onChange={(event) => {
                                                field.onChange(
                                                    event.target.value,
                                                );
                                                onTenantChange?.(
                                                    event.target.value,
                                                );
                                            }}
                                            disabled={
                                                Boolean(
                                                    disableTenantSelection,
                                                ) || loading
                                            }
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
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分类</FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(
                                                    value
                                                        ? Number.parseInt(
                                                              value,
                                                              10,
                                                          )
                                                        : undefined,
                                                );
                                            }}
                                            value={
                                                field.value
                                                    ? `${field.value}`
                                                    : undefined
                                            }
                                            disabled={
                                                !selectedTenantId ||
                                                Boolean(
                                                    disableTenantSelection,
                                                ) ||
                                                loading
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择分类" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="">
                                                    无
                                                </SelectItem>
                                                {categories.map((category) => (
                                                    <SelectItem
                                                        key={category.id}
                                                        value={`${category.id}`}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!selectedTenantId ? (
                                            <FormDescription>
                                                请选择租户后再选择对应分类。
                                            </FormDescription>
                                        ) : categories.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                当前租户暂无分类，可先在租户侧新增分类。
                                            </p>
                                        ) : null}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>截止日期</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                        <div className="flex items-center space-x-2">
                            <Button
                                type="submit"
                                disabled={loading || !selectedTenantId}
                            >
                                {loading ? "提交中..." : submitLabel}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
