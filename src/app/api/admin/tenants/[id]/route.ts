import { NextResponse } from "next/server";
import { getTenantDetail } from "@/modules/admin/services/tenant.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

type RouteContext = {
    params: Promise<Params>;
};

export async function GET(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const tenant = await getTenantDetail(id);
    if (!tenant) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tenant });
}
