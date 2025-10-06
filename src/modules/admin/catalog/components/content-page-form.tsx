"use client";

import { useCreate, useNotification, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ContentPageInput } from "@/modules/admin/services/catalog.service";

interface ContentPageFormProps {
    id?: number;
    initialData?: Partial<ContentPageInput>;
}

export function ContentPageForm({ id, initialData }: ContentPageFormProps) {
    const router = useRouter();
    const { open } = useNotification();
    const { mutateAsync: createPage } = useCreate();
    const { mutateAsync: updatePage } = useUpdate();

    const form = useForm<ContentPageInput>({
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
    const { reset } = form;

    useEffect(() => {
        if (!initialData) {
            return;
        }

        reset({
            title: initialData.title ?? "",
            slug: initialData.slug ?? "",
            summary: initialData.summary ?? "",
            language: initialData.language ?? "zh-CN",
            status: initialData.status ?? "draft",
            content: initialData.content ?? "",
            publishedAt: initialData.publishedAt ?? "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, reset]);

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
                <label className="text-sm font-medium" htmlFor="content-title">
                    标题
                </label>
                <Input
                    id="content-title"
                    {...form.register("title", { required: true })}
                    placeholder="功能介绍"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="content-slug">
                    Slug
                </label>
                <Input
                    id="content-slug"
                    {...form.register("slug", { required: true })}
                    placeholder="features"
                />
            </div>
            <div className="grid gap-2">
                <label
                    className="text-sm font-medium"
                    htmlFor="content-summary"
                >
                    摘要
                </label>
                <Textarea
                    id="content-summary"
                    rows={3}
                    {...form.register("summary")}
                />
            </div>
            <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="content-language"
                    >
                        语言
                    </label>
                    <Input
                        id="content-language"
                        {...form.register("language")}
                        placeholder="zh-CN"
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="content-status"
                    >
                        状态
                    </label>
                    <Input
                        id="content-status"
                        {...form.register("status")}
                        placeholder="draft"
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="content-published-at"
                    >
                        发布时间
                    </label>
                    <Input
                        id="content-published-at"
                        type="datetime-local"
                        {...form.register("publishedAt")}
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="content-body">
                    正文
                </label>
                <Textarea
                    id="content-body"
                    rows={8}
                    {...form.register("content")}
                />
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    保存
                </Button>
            </div>
        </form>
    );
}
