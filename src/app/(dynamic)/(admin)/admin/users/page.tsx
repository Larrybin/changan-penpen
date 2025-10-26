import type { Metadata } from "next";

import { generateAdminMetadata } from "@/modules/admin/metadata";
import { UsersListPage } from "@/modules/admin/users/pages/users-list.page";

export async function generateMetadata(): Promise<Metadata> {
    return generateAdminMetadata({
        path: "/admin/users",
        title: "用户管理",
        description: "浏览并管理所有注册用户。",
        robots: { index: false, follow: false },
    });
}

interface AdminUsersPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({
    searchParams,
}: AdminUsersPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : undefined;

    return <UsersListPage searchParams={resolvedSearchParams} />;
}
