import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("billingSuccess.title"),
        description: t("billingSuccess.description"),
    };
}

export default async function Page() {
    const t = await getTranslations("BillingStatus.success");
    return (
        <div className="mx-auto max-w-xl py-16 px-6 text-center space-y-6">
            <h1 className="text-title-sm font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
            <div className="flex gap-3 justify-center">
                <Link href={dashboardRoutes.dashboard}>
                    <Button>{t("primaryCta")}</Button>
                </Link>
                <Link href="/billing">
                    <Button variant="outline">{t("secondaryCta")}</Button>
                </Link>
            </div>
        </div>
    );
}
