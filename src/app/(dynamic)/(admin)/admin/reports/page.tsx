import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { ReportsPage } from "@/modules/admin/reports/pages/reports.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/reports",
        robots: { index: false, follow: false },
    });
}

export default function ReportsRoute() {
    return <ReportsPage />;
}
