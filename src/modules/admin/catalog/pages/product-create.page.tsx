"use client";

import { ProductForm } from "@/modules/admin/catalog/components/product-form";

export function ProductCreatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">新建商品</h1>
                <p className="text-sm text-muted-foreground">
                    配置商品基本信息、价格与状态。
                </p>
            </div>
            <ProductForm />
        </div>
    );
}
