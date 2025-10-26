import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { MarketingContentPage } from "@/modules/admin/settings/pages/marketing-content.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/settings/marketing",
        robots: { index: false, follow: false },
    });
}

export default function MarketingContentRoute() {
    return <MarketingContentPage />;
}
