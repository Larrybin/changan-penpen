import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { TenantDetailPage } from "@/modules/tenant-admin/pages/tenant-detail.page";

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
        ? `/admin/tenants/${encodeURIComponent(id)}`
        : "/admin/tenants";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default async function TenantDetail({
    params,
}: {
    params: Promise<Params>;
}) {
    const { id } = await params;
    return <TenantDetailPage id={id} />;
}
