import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { getSession } from "@/modules/auth/utils/auth-utils";
import authRoutes from "../auth/auth.route";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect(authRoutes.login);
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Navigation />

            <div className="mx-auto w-full px-4 py-8 md:w-xl">{children}</div>
        </div>
    );
}
