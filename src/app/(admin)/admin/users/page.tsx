import type { Metadata } from "next";

import { config } from "@/config";
import { generateAdminMetadata } from "@/modules/admin/metadata";
import { UsersListPage } from "@/modules/admin/users/pages/users-list.page";

const pageRevalidate = Math.max(0, Math.floor(config.cache.defaultTtlSeconds));

export const revalidate = pageRevalidate;

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/users",
        title: "用户管理",
        description: "浏览并管理所有注册用户。",
        robots: { index: false, follow: false },
    });
}

interface AdminUsersPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

export default function AdminUsersPage({
    searchParams,
}: AdminUsersPageProps) {
    return <UsersListPage searchParams={searchParams} />;
}
