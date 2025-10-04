import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
    getAdminAccessConfig,
    isEntryTokenValid,
} from "@/modules/admin/utils/admin-access";

interface Params {
    token: string;
}

export default async function AdminEntryPage({ params }: { params: Params }) {
    const config = await getAdminAccessConfig();

    if (
        !params.token ||
        !config.entryToken ||
        !isEntryTokenValid(params.token, config)
    ) {
        redirect("/login?admin=1&error=invalid-entry");
    }

    const cookieStore = await cookies();
    cookieStore.set({
        name: "admin-entry",
        value: config.entryToken,
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
    });

    redirect("/login?admin=1&admin-entry=granted");
}
