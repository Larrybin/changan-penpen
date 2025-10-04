import { TenantDetailPage } from "@/modules/admin/tenants/pages/tenant-detail.page";

interface Params {
    id: string;
}

export default function TenantDetail({ params }: { params: Params }) {
    return <TenantDetailPage id={params.id} />;
}
