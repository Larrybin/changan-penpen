"use client";

import { PageHeader } from "@/components/layout/page-header";
import { CouponForm } from "@/modules/admin/catalog/components/coupon-form";

export function CouponCreatePage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="新建优惠券"
                description="配置折扣类型、有效期与状态。"
            />
            <CouponForm />
        </div>
    );
}
