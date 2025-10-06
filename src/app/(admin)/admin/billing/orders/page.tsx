import type { Metadata } from "next";

import { OrdersListPage } from "@/modules/admin/billing/pages/orders-list.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/billing/orders",
        robots: { index: false, follow: false },
    });
}

export default function OrdersPage() {
    return <OrdersListPage />;
}
