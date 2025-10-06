"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { CouponForm } from "@/modules/admin/catalog/components/coupon-form";

export function CouponEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const isValidId = Number.isFinite(id);
    const effectiveId = isValidId ? id : 0;

    const { query, result } = useOne({
        resource: "coupons",
        id: effectiveId,
        queryOptions: {
            enabled: isValidId,
        },
    });

    if (!isValidId) {
        return <p className="text-sm text-muted-foreground">参数错误</p>;
    }

    const isLoading = query.isLoading;
    if (isLoading) {
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    if (!result?.data) {
        return (
            <p className="text-sm text-muted-foreground">未找到该优惠券。</p>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">编辑优惠券</h1>
                <p className="text-sm text-muted-foreground">更新折扣信息。</p>
            </div>
            <CouponForm id={id} initialData={result.data} />
        </div>
    );
}
