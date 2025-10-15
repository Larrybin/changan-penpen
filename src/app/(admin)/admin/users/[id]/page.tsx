import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { UserDetailPage } from "@/modules/admin/users/pages/user-detail.page";

interface AdminUserDetailPageProps {
    params: Promise<{
        id?: string | string[];
    }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
    params,
}: AdminUserDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    const userId = Array.isArray(id) ? (id[0] ?? "") : (id ?? "");

    return generateAdminMetadata({
        path: `/admin/users/${userId}`,
        title: "用户详情",
        description: "查看用户详情与积分、用量数据。",
        robots: { index: false, follow: false },
    });
}

export default async function AdminUserDetailPage({
    params,
}: AdminUserDetailPageProps) {
    const { id } = await params;
    const userId = Array.isArray(id) ? id[0] : id;

    if (!userId) {
        notFound();
    }

    return <UserDetailPage userId={userId} />;
}
