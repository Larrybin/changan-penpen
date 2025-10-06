import type { Metadata } from "next";

import AdminLayout from "@/modules/admin/admin.layout";
import { generateAdminMetadata } from "@/modules/admin/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin",
        robots: { index: false, follow: false },
    });
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayout>{children}</AdminLayout>;
}
