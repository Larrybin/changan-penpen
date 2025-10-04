"use client";

import Link from "next/link";
import { useList, useDelete } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import adminRoutes from "@/modules/admin/routes/admin.routes";

export function ProductsListPage() {
    const { data, isLoading } = useList({ resource: "products" });
    const { mutateAsync: deleteProduct } = useDelete();
    const products = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">商品管理</h1>
                    <p className="text-sm text-muted-foreground">
                        维护 SaaS 套餐或一次性商品。
                    </p>
                </div>
                <Button asChild>
                    <Link href={`${adminRoutes.catalog.products}/create`}>
                        新建商品
                    </Link>
                </Button>
            </div>
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
                                    {product.name}
                                </td>
                                <td className="px-4 py-3">{product.slug}</td>
                                <td className="px-4 py-3">
                                    {new Intl.NumberFormat("zh-CN", {
                                        style: "currency",
                                        currency: product.currency ?? "USD",
                                    }).format((product.priceCents ?? 0) / 100)}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {product.status}
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
