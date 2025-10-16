"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/modules/admin/catalog/components/product-form";

export function ProductEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const isValidId = Number.isFinite(id);
    const effectiveId = isValidId ? id : 0;

    const { query, result } = useOne({
        resource: "products",
        id: effectiveId,
        queryOptions: {
            enabled: isValidId,
        },
    });

    if (!isValidId) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader title="编辑商品" description="更新商品信息。" />
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
                <PageHeader title="编辑商品" description="更新商品信息。" />
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                            key={`product-edit-skeleton-${index}`}
                            className="h-12 w-full"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!result?.data) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader title="编辑商品" description="更新商品信息。" />
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    未找到该商品。
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader title="编辑商品" description="更新商品信息。" />
            <ProductForm id={id} initialData={result.data} />
        </div>
    );
}
