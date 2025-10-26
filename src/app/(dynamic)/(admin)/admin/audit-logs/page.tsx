import type { Metadata } from "next";

import { AuditLogsPage } from "@/modules/admin/audit/pages/audit-logs.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/audit-logs",
        robots: { index: false, follow: false },
    });
}

export default function AuditLogsRoute() {
    return <AuditLogsPage />;
}
