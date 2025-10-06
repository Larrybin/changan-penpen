import type { Metadata } from "next";

import { CreditsHistoryPage } from "@/modules/admin/billing/pages/credits-history.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/billing/credits",
        robots: { index: false, follow: false },
    });
}

export default function CreditsPage() {
    return <CreditsHistoryPage />;
}
