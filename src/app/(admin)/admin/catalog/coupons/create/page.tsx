import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { CouponCreatePage } from "@/modules/admin/catalog/pages/coupon-create.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/coupons/create",
        robots: { index: false, follow: false },
    });
}

export default function CouponCreateRoute() {
    return <CouponCreatePage />;
}
