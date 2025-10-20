import AuthLayout from "@/modules/auth/auth.layout";
import Toast from "@/components/ui/toast";

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
