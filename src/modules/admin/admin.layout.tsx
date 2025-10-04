import { requireAuth } from "@/modules/auth/utils/auth-utils";
import { requireAdminForPage } from "@/modules/admin/utils/admin-access";
import { AdminRefineApp } from "@/modules/admin/components/admin-refine-app";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireAuth();
    await requireAdminForPage(user);

    return <AdminRefineApp user={user}>{children}</AdminRefineApp>;
}
