"use client";

import { CouponForm } from "@/modules/admin/catalog/components/coupon-form";

export function CouponCreatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">新建优惠券</h1>
                <p className="text-sm text-muted-foreground">
                    配置折扣类型、有效期与状态。
                </p>
            </div>
            <CouponForm />
        </div>
    );
}
