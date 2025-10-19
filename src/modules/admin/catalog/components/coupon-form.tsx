"use client";

import {
    AdminDateTimeField,
    AdminTextareaField,
    AdminTextField,
} from "@/modules/admin/components/admin-form-fields";
import { AdminResourceForm } from "@/modules/admin/components/admin-resource-form";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { CouponInput } from "@/modules/admin/services/catalog.service";

interface CouponFormProps {
    id?: number;
    initialData?: Partial<CouponInput>;
}

const COUPON_DEFAULT_VALUES: CouponInput = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    maxRedemptions: 0,
    startsAt: "",
    endsAt: "",
    status: "inactive",
};

export function CouponForm({ id, initialData }: CouponFormProps) {
    const normalizedInitialData = initialData
        ? {
              code: initialData.code ?? "",
              description: initialData.description ?? "",
              discountType: initialData.discountType ?? "percentage",
              discountValue: initialData.discountValue ?? 0,
              maxRedemptions: initialData.maxRedemptions ?? 0,
              startsAt: initialData.startsAt ?? "",
              endsAt: initialData.endsAt ?? "",
              status: initialData.status ?? "inactive",
          }
        : undefined;

    return (
        <AdminResourceForm<CouponInput>
            resource="coupons"
            id={id}
            defaultValues={COUPON_DEFAULT_VALUES}
            initialValues={normalizedInitialData}
            cancelHref={adminRoutes.catalog.coupons}
            successMessages={{ create: "优惠券已创建", update: "优惠券已更新" }}
            prepareSubmit={(values) => ({
                ...values,
                discountValue: Number(values.discountValue ?? 0),
                maxRedemptions: values.maxRedemptions
                    ? Number(values.maxRedemptions)
                    : null,
            })}
        >
            {(form) => (
                <>
                    <AdminTextField
                        form={form}
                        name="code"
                        label="优惠码"
                        id="coupon-code"
                        placeholder="WELCOME10"
                        registerOptions={{ required: true }}
                    />
                    <AdminTextareaField
                        form={form}
                        name="description"
                        label="描述"
                        id="coupon-description"
                        rows={3}
                    />
                    <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                        <AdminTextField
                            form={form}
                            name="discountType"
                            label="折扣类型"
                            id="coupon-discount-type"
                            placeholder="percentage"
                        />
                        <AdminTextField
                            form={form}
                            name="discountValue"
                            label="折扣值"
                            id="coupon-discount-value"
                            type="number"
                            registerOptions={{ valueAsNumber: true }}
                        />
                        <AdminTextField
                            form={form}
                            name="maxRedemptions"
                            label="最大兑换次数"
                            id="coupon-max-redemptions"
                            type="number"
                            registerOptions={{ valueAsNumber: true }}
                        />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                        <AdminDateTimeField
                            form={form}
                            name="startsAt"
                            label="开始时间"
                            id="coupon-starts-at"
                        />
                        <AdminDateTimeField
                            form={form}
                            name="endsAt"
                            label="结束时间"
                            id="coupon-ends-at"
                        />
                    </div>
                    <AdminTextField
                        form={form}
                        name="status"
                        label="状态"
                        id="coupon-status"
                        placeholder="active"
                    />
                </>
            )}
        </AdminResourceForm>
    );
}
