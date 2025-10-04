import { TenantDetailPage } from "@/modules/admin/tenants/pages/tenant-detail.page";

interface Params {
    id: string;
}

export default async function TenantDetail({
    params,
}: {
    params: Promise<Params>;
}) {
    const { id } = await params;
    return <TenantDetailPage id={id} />;
}
