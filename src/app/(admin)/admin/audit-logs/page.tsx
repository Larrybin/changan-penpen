import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { AuditLogsPage } from "@/modules/admin/audit/pages/audit-logs.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/audit-logs",
        robots: { index: false, follow: false },
    });
}

export default function AuditLogsRoute() {
    return <AuditLogsPage />;
}
