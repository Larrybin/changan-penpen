"use client";

import { useDelete, useList } from "@refinedev/core";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { CouponRecord } from "@/modules/admin/types/resource.types";

export function CouponsListPage() {
    const { query, result } = useList<CouponRecord>({
        resource: "coupons",
    });
    const { mutateAsync: deleteCoupon } = useDelete();
    const isLoading = query.isLoading;
    const coupons = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">优惠券管理</h1>
                    <p className="text-sm text-muted-foreground">
                        维护折扣码、有效期与状态。
                    </p>
                </div>
                <Button asChild>
                    <Link href={`${adminRoutes.catalog.coupons}/create`}>
                        新建优惠券
                    </Link>
                </Button>
            </div>
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">优惠码</th>
                            <th className="px-4 py-3">折扣</th>
                            <th className="px-4 py-3">兑换限制</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
                        {!isLoading && coupons.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无优惠券。
                                </td>
                            </tr>
                        )}
                        {coupons.map((coupon) => (
                            <tr key={coupon.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    {coupon.code ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {coupon.discountType === "percentage"
                                        ? `${coupon.discountValue ?? 0}%`
                                        : (coupon.discountValue ?? 0)}
                                </td>
                                <td className="px-4 py-3">
                                    {coupon.maxRedemptions ?? "无限"} / 已使用{" "}
                                    {coupon.redeemedCount ?? 0}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {coupon.status ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link
                                            href={`${adminRoutes.catalog.coupons}/edit/${coupon.id}`}
                                        >
                                            编辑
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={async () => {
                                            await deleteCoupon({
                                                resource: "coupons",
                                                id: coupon.id,
                                            });
                                        }}
                                    >
                                        删除
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
