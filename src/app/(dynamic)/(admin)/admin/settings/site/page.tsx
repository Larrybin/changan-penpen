import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { SiteSettingsPage } from "@/modules/admin/settings/pages/site-settings.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/settings/site",
        robots: { index: false, follow: false },
    });
}

export default function SiteSettingsRoute() {
    return <SiteSettingsPage />;
}
