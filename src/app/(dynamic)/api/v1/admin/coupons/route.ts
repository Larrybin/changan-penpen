import { NextResponse } from "next/server";
import {
    type CouponInput,
    createCoupon,
    listCoupons,
} from "@/modules/admin/services/catalog.service";
import { withAdminRoute } from "@/modules/admin/utils/api-guard";

export const GET = withAdminRoute(async () => {
    const coupons = await listCoupons();
    return NextResponse.json({ data: coupons, total: coupons.length });
});

export const POST = withAdminRoute(async ({ request, user }) => {
    const body = (await request.json()) as CouponInput;
    const created = await createCoupon(body, user.email ?? "admin");
    return NextResponse.json({ data: created });
});
