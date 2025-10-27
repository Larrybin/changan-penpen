import { NextResponse } from "next/server";
import {
    type CouponInput,
    deleteCoupon,
    getCouponById,
    updateCoupon,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

interface Params {
    id: string;
}

export const GET = withAdminRoute<Params>(async ({ params }) => {
    const coupon = await getCouponById(Number(params.id));
    if (!coupon) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: coupon });
});

export const PATCH = withAdminRoute<Params>(
    async ({ request, params, user }) => {
        const body = (await request.json()) as CouponInput;
        const updated = await updateCoupon(
            Number(params.id),
            body,
            user.email ?? "admin",
        );
        return NextResponse.json({ data: updated });
    },
);

export const DELETE = withAdminRoute<Params>(async ({ params, user }) => {
    await deleteCoupon(Number(params.id), user.email ?? "admin");
    return NextResponse.json({ success: true });
});
