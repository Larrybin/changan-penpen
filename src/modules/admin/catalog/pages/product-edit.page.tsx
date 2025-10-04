"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ProductForm } from "@/modules/admin/catalog/components/product-form";

export function ProductEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);

    if (!Number.isFinite(id)) {
        return <p className="text-sm text-muted-foreground">参数错误</p>;
    }

    const { data, isLoading } = useOne({ resource: "products", id });

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    if (!data?.data) {
        return <p className="text-sm text-muted-foreground">未找到该商品。</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">编辑商品</h1>
                <p className="text-sm text-muted-foreground">更新商品信息。</p>
            </div>
            <ProductForm id={id} initialData={data.data} />
        </div>
    );
}
