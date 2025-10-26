import type { Metadata } from "next";

import { ContentPagesListPage } from "@/modules/admin/catalog/pages/content-pages-list.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/content-pages",
        robots: { index: false, follow: false },
    });
}

export default function ContentPagesRoute() {
    return <ContentPagesListPage />;
}
