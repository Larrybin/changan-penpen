import { NextResponse } from "next/server";
import { getOrderById } from "@/modules/admin/services/billing.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const order = await getOrderById(Number(params.id));
    if (!order) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
});
