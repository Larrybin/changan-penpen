import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { ProductEditPage } from "@/modules/admin/catalog/pages/product-edit.page";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Params>;
}): Promise<Metadata> {
    const { id } = await params;
    const path = id
        ? `/admin/catalog/products/${encodeURIComponent(id)}/edit`
        : "/admin/catalog/products";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default function ProductEditRoute() {
    return <ProductEditPage />;
}
