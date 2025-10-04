import { NextResponse } from "next/server";
import { getOrderById } from "@/modules/admin/services/billing.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const order = await getOrderById(Number(params.id));
    if (!order) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
}
