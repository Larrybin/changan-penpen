import type { Metadata } from "next";

import { CouponCreatePage } from "@/modules/admin/catalog/pages/coupon-create.page";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/catalog/coupons/create",
        robots: { index: false, follow: false },
    });
}

export default function CouponCreateRoute() {
    return <CouponCreatePage />;
}
