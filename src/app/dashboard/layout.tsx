import nextDynamic from "next/dynamic";

import DashboardLayout from "@/modules/dashboard/dashboard.layout";

const Toast = nextDynamic(() => import("@/components/ui/toast"), {
    ssr: false,
});

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <DashboardLayout>{children}</DashboardLayout>
            <Toast />
        </>
    );
}
