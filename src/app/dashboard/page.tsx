import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Dashboard from "@/modules/dashboard/dashboard.page";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("dashboard.title"),
        description: t("dashboard.description"),
    };
}

export default async function Page() {
    return <Dashboard />;
}
