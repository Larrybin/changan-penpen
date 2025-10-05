import DashboardLayout from "@/modules/dashboard/dashboard.layout";

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
