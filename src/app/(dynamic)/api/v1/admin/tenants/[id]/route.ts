import { NextResponse } from "next/server";
import { getTenantDetail } from "@/modules/tenant-admin/services/tenant.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const tenant = await getTenantDetail(params.id);
    if (!tenant) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tenant });
});
