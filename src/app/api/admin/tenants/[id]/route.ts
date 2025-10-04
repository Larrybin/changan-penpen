import { NextResponse } from "next/server";
import { getTenantDetail } from "@/modules/admin/services/tenant.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const tenant = await getTenantDetail(params.id);
    if (!tenant) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tenant });
}
