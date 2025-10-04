import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import LoginPage from "@/modules/auth/login.page";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("login.title"),
        description: t("login.description"),
    };
}

export default async function Page() {
    return <LoginPage />;
}
