import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { TenantsListPage } from "@/modules/admin/tenants/pages/tenants-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/tenants",
        robots: { index: false, follow: false },
    });
}

export default function TenantsPage() {
    return <TenantsListPage />;
}
