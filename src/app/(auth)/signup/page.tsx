import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SignUpPage from "@/modules/auth/signup.page";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("signup.title"),
        description: t("signup.description"),
    };
}

export default async function Page() {
    return <SignUpPage />;
}
