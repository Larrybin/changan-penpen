import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { CreditsHistoryPage } from "@/modules/admin/billing/pages/credits-history.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/billing/credits",
        robots: { index: false, follow: false },
    });
}

export default function CreditsPage() {
    return <CreditsHistoryPage />;
}
