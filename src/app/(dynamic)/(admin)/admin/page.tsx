import type { Metadata } from "next";

import { AdminDashboardPage } from "@/modules/admin/dashboard/pages/dashboard.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin",
        robots: { index: false, follow: false },
    });
}

export default function AdminIndexPage() {
    return <AdminDashboardPage />;
}
