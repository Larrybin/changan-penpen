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
import type { ProductRecord } from "@/modules/admin/types/resource.types";

const formatCurrency = (
    amountCents?: number | null,
    currency?: string | null,
) => {
    const normalizedAmount = typeof amountCents === "number" ? amountCents : 0;
    const code =
        typeof currency === "string" && currency.length > 0 ? currency : "USD";

    return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: code,
    }).format(normalizedAmount / 100);
};

export function ProductsListPage() {
    const queryClient = useQueryClient();
    const listQuery = useQuery({
        queryKey: adminQueryKeys.list("products"),
        queryFn: () => fetchAdminList<ProductRecord>({ resource: "products" }),
    });
    const deleteMutation = useMutation({
        mutationFn: (productId: number | string) =>
            deleteAdminRecord({ resource: "products", id: productId }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("products"),
            });
            toast.success("商品已删除");
        },
    });
    const isLoading = listQuery.isLoading;
    const products = listQuery.data?.items ?? [];
    const columns: AdminResourceTableColumn<ProductRecord>[] = [
        {
            id: "name",
            header: "名称",
            cellClassName: "font-medium",
            render: (product) => product.name ?? "-",
        },
        {
            id: "slug",
            header: "Slug",
            render: (product) => product.slug ?? "-",
        },
        {
            id: "price",
            header: "价格",
            render: (product) =>
                formatCurrency(product.priceCents, product.currency),
        },
        {
            id: "status",
            header: "状态",
            cellClassName: "capitalize",
            render: (product) => product.status ?? "-",
        },
        {
            id: "actions",
            header: "",
            headerClassName: "w-0",
            cellClassName: "text-right space-x-2",
            render: (product) => (
                <>
                    <Button asChild size="sm" variant="ghost">
                        <Link
                            href={`${adminRoutes.catalog.products}/edit/${product.id}`}
                        >
                            编辑
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={async () => {
                            await deleteMutation.mutateAsync(product.id);
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
                title="商品管理"
                description="维护 SaaS 套餐或一次性商品。"
                actions={
                    <Button asChild>
                        <Link href={`${adminRoutes.catalog.products}/create`}>
                            新建商品
                        </Link>
                    </Button>
                }
            />
            <AdminResourceTable
                columns={columns}
                items={products}
                isLoading={isLoading}
                emptyState="暂无商品，请先创建。"
                getRowKey={(product) => product.id}
            />
        </div>
    );
}
