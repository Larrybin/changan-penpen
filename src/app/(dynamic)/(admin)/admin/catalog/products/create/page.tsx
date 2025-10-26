import type { Metadata } from "next";

import { ProductCreatePage } from "@/modules/admin/catalog/pages/product-create.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/products/create",
        robots: { index: false, follow: false },
    });
}

export default function ProductCreateRoute() {
    return <ProductCreatePage />;
}
