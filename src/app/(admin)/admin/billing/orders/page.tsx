import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { OrdersListPage } from "@/modules/admin/billing/pages/orders-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/billing/orders",
        robots: { index: false, follow: false },
    });
}

export default function OrdersPage() {
    return <OrdersListPage />;
}
