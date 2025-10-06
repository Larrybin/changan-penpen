import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { CouponsListPage } from "@/modules/admin/catalog/pages/coupons-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/coupons",
        robots: { index: false, follow: false },
    });
}

export default function CouponsPage() {
    return <CouponsListPage />;
}
