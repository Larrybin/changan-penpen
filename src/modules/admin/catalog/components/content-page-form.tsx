"use client";

import {
    AdminDateTimeField,
    AdminTextareaField,
    AdminTextField,
} from "@/modules/admin/components/admin-form-fields";
import { AdminResourceForm } from "@/modules/admin/components/admin-resource-form";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ContentPageInput } from "@/modules/admin/services/catalog.service";

interface ContentPageFormProps {
    id?: number;
    initialData?: Partial<ContentPageInput>;
}

const CONTENT_PAGE_DEFAULT_VALUES: ContentPageInput = {
    title: "",
    slug: "",
    summary: "",
    language: "zh-CN",
    status: "draft",
    content: "",
    publishedAt: "",
};

export function ContentPageForm({ id, initialData }: ContentPageFormProps) {
    const normalizedInitialData = initialData
        ? {
              title: initialData.title ?? "",
              slug: initialData.slug ?? "",
              summary: initialData.summary ?? "",
              language: initialData.language ?? "zh-CN",
              status: initialData.status ?? "draft",
              content: initialData.content ?? "",
              publishedAt: initialData.publishedAt ?? "",
          }
        : undefined;

    return (
        <AdminResourceForm<ContentPageInput>
            resource="content-pages"
            id={id}
            defaultValues={CONTENT_PAGE_DEFAULT_VALUES}
            initialValues={normalizedInitialData}
            cancelHref={adminRoutes.catalog.contentPages}
            successMessages={{ create: "内容已创建", update: "内容已更新" }}
            prepareSubmit={(values) => ({
                ...values,
                publishedAt: values.publishedAt || null,
            })}
        >
            {(form) => (
                <>
                    <AdminTextField
                        form={form}
                        name="title"
                        label="标题"
                        id="content-title"
                        placeholder="功能介绍"
                        registerOptions={{ required: true }}
                    />
                    <AdminTextField
                        form={form}
                        name="slug"
                        label="Slug"
                        id="content-slug"
                        placeholder="features"
                        registerOptions={{ required: true }}
                    />
                    <AdminTextareaField
                        form={form}
                        name="summary"
                        label="摘要"
                        id="content-summary"
                        rows={3}
                    />
                    <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                        <AdminTextField
                            form={form}
                            name="language"
                            label="语言"
                            id="content-language"
                            placeholder="zh-CN"
                        />
                        <AdminTextField
                            form={form}
                            name="status"
                            label="状态"
                            id="content-status"
                            placeholder="draft"
                        />
                        <AdminDateTimeField
                            form={form}
                            name="publishedAt"
                            label="发布时间"
                            id="content-published-at"
                        />
                    </div>
                    <AdminTextareaField
                        form={form}
                        name="content"
                        label="正文"
                        id="content-body"
                        rows={8}
                    />
                </>
            )}
        </AdminResourceForm>
    );
}
