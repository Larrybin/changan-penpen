import type { Metadata } from "next";

import { ContentPageCreatePage } from "@/modules/admin/catalog/pages/content-page-create.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/content-pages/create",
        robots: { index: false, follow: false },
    });
}

export default function ContentPageCreateRoute() {
    return <ContentPageCreatePage />;
}
