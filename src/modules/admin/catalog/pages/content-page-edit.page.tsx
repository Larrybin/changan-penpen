"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentPageForm } from "@/modules/admin/catalog/components/content-page-form";

const CONTENT_EDIT_SKELETON_KEYS = Array.from(
    { length: 4 },
    (_, index) => `content-edit-skeleton-${index}`,
);

export function ContentPageEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const isValidId = Number.isFinite(id);
    const effectiveId = isValidId ? id : 0;

    const { query, result } = useOne({
        resource: "content-pages",
        id: effectiveId,
        queryOptions: {
            enabled: isValidId,
        },
    });

    if (!isValidId) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="编辑内容页"
                    description="调整页面内容与发布状态。"
                />
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    参数错误。
                </div>
            </div>
        );
    }

    const isLoading = query.isLoading;
    if (isLoading) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="编辑内容页"
                    description="调整页面内容与发布状态。"
                />
                <div className="space-y-4">
                    {CONTENT_EDIT_SKELETON_KEYS.map((key) => (
                        <Skeleton key={key} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!result?.data) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="编辑内容页"
                    description="调整页面内容与发布状态。"
                />
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    未找到该内容页。
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="编辑内容页"
                description="调整页面内容与发布状态。"
            />
            <ContentPageForm id={id} initialData={result.data} />
        </div>
    );
}
