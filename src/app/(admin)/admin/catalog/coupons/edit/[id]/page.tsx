import type { Metadata } from "next";

import { CouponEditPage } from "@/modules/admin/catalog/pages/coupon-edit.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

interface Params {
    id: string;
}

export async function generateMetadata({
    params,
}: {
    params: Params;
}): Promise<Metadata> {
    const { id } = params;
    const path = id
        ? `/admin/catalog/coupons/${encodeURIComponent(id)}/edit`
        : "/admin/catalog/coupons";
    return generateAdminMetadata({
        path,
        robots: { index: false, follow: false },
    });
}

export default function CouponEditRoute() {
    return <CouponEditPage />;
}
