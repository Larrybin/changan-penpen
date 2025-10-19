"use client";

import {
    AdminTextareaField,
    AdminTextField,
} from "@/modules/admin/components/admin-form-fields";
import { AdminResourceForm } from "@/modules/admin/components/admin-resource-form";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ProductInput } from "@/modules/admin/services/catalog.service";

export interface ProductFormProps {
    id?: number;
    initialData?: Partial<ProductInput>;
}

const PRODUCT_DEFAULT_VALUES: ProductInput = {
    slug: "",
    name: "",
    description: "",
    priceCents: 0,
    currency: "USD",
    type: "one_time",
    status: "draft",
    metadata: "",
};

export function ProductForm({ id, initialData }: ProductFormProps) {
    const normalizedInitialData = initialData
        ? {
              slug: initialData.slug ?? "",
              name: initialData.name ?? "",
              description: initialData.description ?? "",
              priceCents: initialData.priceCents ?? 0,
              currency: initialData.currency ?? "USD",
              type: initialData.type ?? "one_time",
              status: initialData.status ?? "draft",
              metadata: initialData.metadata ?? "",
          }
        : undefined;

    return (
        <AdminResourceForm<ProductInput>
            resource="products"
            id={id}
            defaultValues={PRODUCT_DEFAULT_VALUES}
            initialValues={normalizedInitialData}
            cancelHref={adminRoutes.catalog.products}
            successMessages={{ create: "商品已创建", update: "商品已更新" }}
            prepareSubmit={(values) => ({
                ...values,
                priceCents: Number(values.priceCents ?? 0),
                metadata: values.metadata ?? "",
            })}
        >
            {(form) => (
                <>
                    <AdminTextField
                        form={form}
                        name="slug"
                        label="Slug"
                        id="product-slug"
                        placeholder="plan-pro"
                        registerOptions={{ required: true }}
                    />
                    <AdminTextField
                        form={form}
                        name="name"
                        label="名称"
                        id="product-name"
                        placeholder="专业版订阅"
                        registerOptions={{ required: true }}
                    />
                    <AdminTextareaField
                        form={form}
                        name="description"
                        label="描述"
                        id="product-description"
                        rows={4}
                    />
                    <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                        <AdminTextField
                            form={form}
                            name="priceCents"
                            label="价格（分）"
                            id="product-price"
                            type="number"
                            registerOptions={{ valueAsNumber: true }}
                        />
                        <AdminTextField
                            form={form}
                            name="currency"
                            label="货币"
                            id="product-currency"
                            placeholder="USD"
                        />
                        <AdminTextField
                            form={form}
                            name="type"
                            label="类型"
                            id="product-type"
                            placeholder="one_time"
                        />
                    </div>
                    <AdminTextField
                        form={form}
                        name="status"
                        label="状态"
                        id="product-status"
                        placeholder="active"
                    />
                    <AdminTextareaField
                        form={form}
                        name="metadata"
                        label="元数据"
                        id="product-metadata"
                        rows={3}
                        placeholder='{"category":"subscription"}'
                    />
                </>
            )}
        </AdminResourceForm>
    );
}
