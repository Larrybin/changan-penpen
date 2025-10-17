"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminQueryKeys } from "@/lib/query/keys";
import {
    deleteAdminRecord,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { CouponRecord } from "@/modules/admin/types/resource.types";

const COUPON_LIST_SKELETON_ROW_KEYS = Array.from(
    { length: 6 },
    (_, index) => `coupon-list-row-${index}`,
);
const COUPON_LIST_SKELETON_CELL_KEYS = Array.from(
    { length: 5 },
    (_, index) => `coupon-list-cell-${index}`,
);

export function CouponsListPage() {
    const queryClient = useQueryClient();
    const listQuery = useQuery({
        queryKey: adminQueryKeys.list("coupons"),
        queryFn: () => fetchAdminList<CouponRecord>({ resource: "coupons" }),
    });
    const deleteMutation = useMutation({
        mutationFn: (couponId: number | string) =>
            deleteAdminRecord({ resource: "coupons", id: couponId }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("coupons"),
            });
            toast.success("优惠券已删除");
        },
    });
    const isLoading = listQuery.isLoading;
    const coupons = listQuery.data?.items ?? [];

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="优惠券管理"
                description="维护折扣码、有效期与状态。"
                actions={
                    <Button asChild>
                        <Link href={`${adminRoutes.catalog.coupons}/create`}>
                            新建优惠券
                        </Link>
                    </Button>
                }
            />
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
                        {isLoading &&
                            COUPON_LIST_SKELETON_ROW_KEYS.map((rowKey) => (
                                <tr key={rowKey}>
                                    {COUPON_LIST_SKELETON_CELL_KEYS.map(
                                        (cellKey) => (
                                            <td
                                                key={`${rowKey}-${cellKey}`}
                                                className="px-4 py-3"
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </td>
                                        ),
                                    )}
                                </tr>
                            ))}
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
                                        disabled={deleteMutation.isPending}
                                        onClick={async () => {
                                            await deleteMutation.mutateAsync(
                                                coupon.id,
                                            );
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
