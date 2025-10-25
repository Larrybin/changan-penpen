"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueryKeys } from "@/lib/query/keys";
import { fetchAdminRecord } from "@/modules/admin/api/resources";
import { CouponForm } from "@/modules/admin/catalog/components/coupon-form";

const COUPON_EDIT_SKELETON_KEYS = Array.from(
    { length: 4 },
    (_, index) => `coupon-edit-skeleton-${index}`,
);

export function CouponEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const isValidId = Number.isFinite(id);
    const effectiveId = isValidId ? id : 0;

    const query = useQuery({
        queryKey: adminQueryKeys.detail("coupons", effectiveId),
        queryFn: ({ signal }) =>
            fetchAdminRecord({
                resource: "coupons",
                id: effectiveId,
                signal,
            }),
        enabled: isValidId,
    });

    if (!isValidId) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader title="编辑优惠券" description="更新折扣信息。" />
                <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
                    参数错误。
                </div>
            </div>
        );
    }

    const isLoading = query.isLoading;
    if (isLoading) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader title="编辑优惠券" description="更新折扣信息。" />
                <div className="space-y-4">
                    {COUPON_EDIT_SKELETON_KEYS.map((key) => (
                        <Skeleton key={key} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (!query.data) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader title="编辑优惠券" description="更新折扣信息。" />
                <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
                    未找到该优惠券。
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader title="编辑优惠券" description="更新折扣信息。" />
            <CouponForm id={id} initialData={query.data ?? undefined} />
        </div>
    );
}
