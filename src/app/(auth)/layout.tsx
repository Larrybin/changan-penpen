import dynamic from "next/dynamic";

import AuthLayout from "@/modules/auth/auth.layout";

const Toast = dynamic(() => import("@/components/ui/toast"), {
    ssr: false,
});

export const dynamic = "force-dynamic";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <AuthLayout>{children}</AuthLayout>
            <Toast />
        </>
    );
}
