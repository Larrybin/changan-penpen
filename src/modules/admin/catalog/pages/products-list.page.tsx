"use client";

import { useDelete, useList } from "@refinedev/core";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ProductRecord } from "@/modules/admin/types/resource.types";

const PRODUCT_LIST_SKELETON_ROW_KEYS = Array.from(
    { length: 6 },
    (_, index) => `product-list-row-${index}`,
);
const PRODUCT_LIST_SKELETON_CELL_KEYS = Array.from(
    { length: 5 },
    (_, index) => `product-list-cell-${index}`,
);

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
    const { query, result } = useList<ProductRecord>({
        resource: "products",
    });
    const { mutateAsync: deleteProduct } = useDelete();
    const isLoading = query.isLoading;
    const products = result?.data ?? [];

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
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">名称</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">价格</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading &&
                            PRODUCT_LIST_SKELETON_ROW_KEYS.map((rowKey) => (
                                <tr key={rowKey}>
                                    {PRODUCT_LIST_SKELETON_CELL_KEYS.map(
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
                        {!isLoading && products.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无商品，请先创建。
                                </td>
                            </tr>
                        )}
                        {products.map((product) => (
                            <tr key={product.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    {product.name ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {product.slug ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {formatCurrency(
                                        product.priceCents,
                                        product.currency,
                                    )}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {product.status ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
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
                                        onClick={async () => {
                                            await deleteProduct({
                                                resource: "products",
                                                id: product.id,
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
