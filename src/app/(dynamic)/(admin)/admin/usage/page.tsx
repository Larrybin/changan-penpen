import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { UsageListPage } from "@/modules/admin/usage/pages/usage-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/usage",
        robots: { index: false, follow: false },
    });
}

export default function UsagePage() {
    return <UsageListPage />;
}
