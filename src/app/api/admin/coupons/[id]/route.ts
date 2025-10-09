import { NextResponse } from "next/server";
import {
    type CouponInput,
    deleteCoupon,
    getCouponById,
    updateCoupon,
} from "@/modules/admin/services/catalog.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

type RouteContext = {
    params: Params;
};

export async function GET(request: Request, context: RouteContext) {
    const { id } = context.params;
    const result = await requireAdminRequest(request);
    if (result.response) {
        return result.response;
    }

    const coupon = await getCouponById(Number(id));
    if (!coupon) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: coupon });
}

export async function PATCH(request: Request, context: RouteContext) {
    const { id } = context.params;
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    const body = (await request.json()) as CouponInput;
    const updated = await updateCoupon(
        Number(id),
        body,
        result.user.email ?? "admin",
    );
    return NextResponse.json({ data: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
    const { id } = context.params;
    const result = await requireAdminRequest(request);
    if (result.response || !result.user) {
        return (
            result.response ??
            NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        );
    }

    await deleteCoupon(Number(id), result.user.email ?? "admin");
    return NextResponse.json({ success: true });
}
