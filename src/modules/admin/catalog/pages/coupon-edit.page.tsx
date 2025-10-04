"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { CouponForm } from "@/modules/admin/catalog/components/coupon-form";

export function CouponEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);

    if (!Number.isFinite(id)) {
        return <p className="text-sm text-muted-foreground">参数错误</p>;
    }

    const { data, isLoading } = useOne({ resource: "coupons", id });

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    if (!data?.data) {
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
            <CouponForm id={id} initialData={data.data} />
        </div>
    );
}
