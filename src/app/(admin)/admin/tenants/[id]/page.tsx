import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { TenantDetailPage } from "@/modules/admin/tenants/pages/tenant-detail.page";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { id } = params;
    const path = id
        ? `/admin/tenants/${encodeURIComponent(id)}`
        : "/admin/tenants";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default async function TenantDetail({ params }: { params: Params }) {
    const { id } = params;
    return <TenantDetailPage id={id} />;
}
