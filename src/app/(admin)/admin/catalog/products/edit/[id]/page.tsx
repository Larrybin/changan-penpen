import type { Metadata } from "next";

import { ProductEditPage } from "@/modules/admin/catalog/pages/product-edit.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { id } = params;
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
