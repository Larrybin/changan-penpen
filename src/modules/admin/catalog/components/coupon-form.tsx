"use client";

import { useCreate, useNotification, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { CouponInput } from "@/modules/admin/services/catalog.service";

interface CouponFormProps {
    id?: number;
    initialData?: Partial<CouponInput>;
}

export function CouponForm({ id, initialData }: CouponFormProps) {
    const router = useRouter();
    const { open } = useNotification();
    const { mutateAsync: createCoupon } = useCreate();
    const { mutateAsync: updateCoupon } = useUpdate();

    const form = useForm<CouponInput>({
        defaultValues: {
            code: "",
            description: "",
            discountType: "percentage",
            discountValue: 0,
            maxRedemptions: 0,
            startsAt: "",
            endsAt: "",
            status: "inactive",
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code ?? "",
                description: initialData.description ?? "",
                discountType: initialData.discountType ?? "percentage",
                discountValue: initialData.discountValue ?? 0,
                maxRedemptions: initialData.maxRedemptions ?? 0,
                startsAt: initialData.startsAt ?? "",
                endsAt: initialData.endsAt ?? "",
                status: initialData.status ?? "inactive",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData?.code, initialData, form.reset]);

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = {
            ...values,
            discountValue: Number(values.discountValue ?? 0),
            maxRedemptions: values.maxRedemptions
                ? Number(values.maxRedemptions)
                : null,
        };

        try {
            if (id) {
                await updateCoupon({
                    resource: "coupons",
                    id,
                    values: payload,
                });
                open?.({ message: "优惠券已更新", type: "success" });
            } else {
                await createCoupon({ resource: "coupons", values: payload });
                open?.({ message: "优惠券已创建", type: "success" });
            }
            router.push(adminRoutes.catalog.coupons);
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
                <label className="text-sm font-medium" htmlFor="coupon-code">
                    优惠码
                </label>
                <Input
                    id="coupon-code"
                    {...form.register("code", { required: true })}
                    placeholder="WELCOME10"
                />
            </div>
            <div className="grid gap-2">
                <label
                    className="text-sm font-medium"
                    htmlFor="coupon-description"
                >
                    描述
                </label>
                <Textarea
                    id="coupon-description"
                    rows={3}
                    {...form.register("description")}
                />
            </div>
            <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="coupon-discount-type"
                    >
                        折扣类型
                    </label>
                    <Input
                        id="coupon-discount-type"
                        {...form.register("discountType")}
                        placeholder="percentage"
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="coupon-discount-value"
                    >
                        折扣值
                    </label>
                    <Input
                        id="coupon-discount-value"
                        type="number"
                        {...form.register("discountValue", {
                            valueAsNumber: true,
                        })}
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="coupon-max-redemptions"
                    >
                        最大兑换次数
                    </label>
                    <Input
                        id="coupon-max-redemptions"
                        type="number"
                        {...form.register("maxRedemptions", {
                            valueAsNumber: true,
                        })}
                    />
                </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 md:gap-4">
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="coupon-starts-at"
                    >
                        开始时间
                    </label>
                    <Input
                        id="coupon-starts-at"
                        type="datetime-local"
                        {...form.register("startsAt")}
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="coupon-ends-at"
                    >
                        结束时间
                    </label>
                    <Input
                        id="coupon-ends-at"
                        type="datetime-local"
                        {...form.register("endsAt")}
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="coupon-status">
                    状态
                </label>
                <Input
                    id="coupon-status"
                    {...form.register("status")}
                    placeholder="active"
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(adminRoutes.catalog.coupons)}
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
