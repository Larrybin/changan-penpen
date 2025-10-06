"use client";

import { useCreate, useNotification, useUpdate } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ProductInput } from "@/modules/admin/services/catalog.service";

export interface ProductFormProps {
    id?: number;
    initialData?: Partial<ProductInput>;
}

export function ProductForm({ id, initialData }: ProductFormProps) {
    const router = useRouter();
    const { open } = useNotification();
    const { mutateAsync: createProduct } = useCreate();
    const { mutateAsync: updateProduct } = useUpdate();

    const form = useForm<ProductInput>({
        defaultValues: {
            slug: "",
            name: "",
            description: "",
            priceCents: 0,
            currency: "USD",
            type: "one_time",
            status: "draft",
            metadata: "",
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                slug: initialData.slug ?? "",
                name: initialData.name ?? "",
                description: initialData.description ?? "",
                priceCents: initialData.priceCents ?? 0,
                currency: initialData.currency ?? "USD",
                type: initialData.type ?? "one_time",
                status: initialData.status ?? "draft",
                metadata: initialData.metadata ?? "",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData?.slug, initialData?.name, initialData, form.reset]);

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = {
            ...values,
            priceCents: Number(values.priceCents ?? 0),
        };

        try {
            if (id) {
                await updateProduct({
                    resource: "products",
                    id,
                    values: payload,
                });
                open?.({
                    message: "商品已更新",
                    type: "success",
                });
            } else {
                await createProduct({ resource: "products", values: payload });
                open?.({
                    message: "商品已创建",
                    type: "success",
                });
            }
            router.push(adminRoutes.catalog.products);
        } catch (error) {
            open?.({
                message: error instanceof Error ? error.message : "保存失败",
                type: "error",
            });
        }
    });

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="product-slug">
                    Slug
                </label>
                <Input
                    id="product-slug"
                    {...form.register("slug", { required: true })}
                    placeholder="plan-pro"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="product-name">
                    名称
                </label>
                <Input
                    id="product-name"
                    {...form.register("name", { required: true })}
                    placeholder="专业版订阅"
                />
            </div>
            <div className="grid gap-2">
                <label
                    className="text-sm font-medium"
                    htmlFor="product-description"
                >
                    描述
                </label>
                <Textarea
                    id="product-description"
                    rows={4}
                    {...form.register("description")}
                />
            </div>
            <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="product-price"
                    >
                        价格（分）
                    </label>
                    <Input
                        id="product-price"
                        type="number"
                        {...form.register("priceCents", {
                            valueAsNumber: true,
                        })}
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="product-currency"
                    >
                        货币
                    </label>
                    <Input
                        id="product-currency"
                        {...form.register("currency")}
                        placeholder="USD"
                    />
                </div>
                <div className="grid gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="product-type"
                    >
                        类型
                    </label>
                    <Input
                        id="product-type"
                        {...form.register("type")}
                        placeholder="one_time"
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="product-status">
                    状态
                </label>
                <Input
                    id="product-status"
                    {...form.register("status")}
                    placeholder="active"
                />
            </div>
            <div className="grid gap-2">
                <label
                    className="text-sm font-medium"
                    htmlFor="product-metadata"
                >
                    元数据
                </label>
                <Textarea
                    id="product-metadata"
                    rows={3}
                    {...form.register("metadata")}
                    placeholder='{"category":"subscription"}'
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(adminRoutes.catalog.products)}
                >
                    取消
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    保存
                </Button>
            </div>
        </form>
    );
}
