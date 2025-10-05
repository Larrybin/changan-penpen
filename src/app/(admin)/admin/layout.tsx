import AdminLayout from "@/modules/admin/admin.layout";

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayout>{children}</AdminLayout>;
}
