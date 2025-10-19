"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { adminQueryKeys } from "@/lib/query/keys";
import { toast } from "@/lib/toast";
import {
    deleteAdminRecord,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import {
    AdminResourceTable,
    type AdminResourceTableColumn,
} from "@/modules/admin/components/admin-resource-table";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { CouponRecord } from "@/modules/admin/types/resource.types";

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
    const columns: AdminResourceTableColumn<CouponRecord>[] = [
        {
            id: "code",
            header: "优惠码",
            cellClassName: "font-medium",
            render: (coupon) => coupon.code ?? "-",
        },
        {
            id: "discount",
            header: "折扣",
            render: (coupon) =>
                coupon.discountType === "percentage"
                    ? `${coupon.discountValue ?? 0}%`
                    : (coupon.discountValue ?? 0),
        },
        {
            id: "limits",
            header: "兑换限制",
            render: (coupon) => (
                <>
                    {coupon.maxRedemptions ?? "无限"} / 已使用{" "}
                    {coupon.redeemedCount ?? 0}
                </>
            ),
        },
        {
            id: "status",
            header: "状态",
            cellClassName: "capitalize",
            render: (coupon) => coupon.status ?? "-",
        },
        {
            id: "actions",
            header: "",
            headerClassName: "w-0",
            cellClassName: "text-right space-x-2",
            render: (coupon) => (
                <>
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
                            await deleteMutation.mutateAsync(coupon.id);
                        }}
                    >
                        删除
                    </Button>
                </>
            ),
        },
    ];

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
            <AdminResourceTable
                columns={columns}
                items={coupons}
                isLoading={isLoading}
                emptyState="暂无优惠券。"
                getRowKey={(coupon) => coupon.id}
            />
        </div>
    );
}
