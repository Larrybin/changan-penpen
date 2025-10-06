import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { AdminDashboardPage } from "@/modules/admin/dashboard/pages/dashboard.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin",
        robots: { index: false, follow: false },
    });
}

export default function AdminIndexPage() {
    return <AdminDashboardPage />;
}
