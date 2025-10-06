import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { ContentPageEditPage } from "@/modules/admin/catalog/pages/content-page-edit.page";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Params>;
}): Promise<Metadata> {
    const { id } = await params;
    const path = id
        ? `/admin/catalog/content-pages/${encodeURIComponent(id)}/edit`
        : "/admin/catalog/content-pages";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default function ContentPageEditRoute() {
    return <ContentPageEditPage />;
}
