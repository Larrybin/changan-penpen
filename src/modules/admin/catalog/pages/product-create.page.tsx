"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/modules/admin/catalog/components/product-form";

export function ProductCreatePage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="新建商品"
                description="配置商品基本信息、价格与状态。"
            />
            <ProductForm />
        </div>
    );
}
