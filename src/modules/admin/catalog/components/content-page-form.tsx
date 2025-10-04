"use client";

import { useEffect } from "react";
import { useCreate, useNotification, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import adminRoutes from "@/modules/admin/routes/admin.routes";

interface ContentPageFormProps {
    id?: number;
    initialData?: Record<string, any>;
}

export function ContentPageForm({ id, initialData }: ContentPageFormProps) {
    const router = useRouter();
    const { open } = useNotification();
    const { mutateAsync: createPage, isLoading: creating } = useCreate();
    const { mutateAsync: updatePage, isLoading: updating } = useUpdate();

    const form = useForm({
        defaultValues: {
            title: "",
            slug: "",
            summary: "",
            language: "zh-CN",
            status: "draft",
            content: "",
            publishedAt: "",
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                title: initialData.title ?? "",
                slug: initialData.slug ?? "",
                summary: initialData.summary ?? "",
                language: initialData.language ?? "zh-CN",
                status: initialData.status ?? "draft",
                content: initialData.content ?? "",
                publishedAt: initialData.publishedAt ?? "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData?.id]);

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = {
            ...values,
            publishedAt: values.publishedAt || null,
        };

        try {
            if (id) {
                await updatePage({
                    resource: "content-pages",
                    id,
                    values: payload,
                });
                open?.({ message: "内容已更新", type: "success" });
            } else {
                await createPage({
                    resource: "content-pages",
                    values: payload,
                });
                open?.({ message: "内容已创建", type: "success" });
            }
            router.push(adminRoutes.catalog.contentPages);
        } catch (error) {
            open?.({
                message: error instanceof Error ? error.message : "保存失败",
                type: "error",
            });
        }
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">标题</label>
                <Input
                    {...form.register("title", { required: true })}
                    placeholder="功能介绍"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                    {...form.register("slug", { required: true })}
                    placeholder="features"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">摘要</label>
                <Textarea rows={3} {...form.register("summary")} />
            </div>
            <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">语言</label>
                    <Input {...form.register("language")} placeholder="zh-CN" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">状态</label>
                    <Input {...form.register("status")} placeholder="draft" />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">发布时间</label>
                    <Input
                        type="datetime-local"
                        {...form.register("publishedAt")}
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">正文</label>
                <Textarea rows={8} {...form.register("content")} />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                        router.push(adminRoutes.catalog.contentPages)
                    }
                >
                    取消
                </Button>
                <Button type="submit" disabled={creating || updating}>
                    保存
                </Button>
            </div>
        </form>
    );
}
