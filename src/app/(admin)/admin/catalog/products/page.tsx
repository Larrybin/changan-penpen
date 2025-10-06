import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { ProductsListPage } from "@/modules/admin/catalog/pages/products-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/products",
        robots: { index: false, follow: false },
    });
}

export default function ProductsPage() {
    return <ProductsListPage />;
}
