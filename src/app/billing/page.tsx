import PricingGrid from "@/modules/creem/components/pricing-grid";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Metadata");
    return {
        title: t("billing.title"),
        description: t("billing.description"),
    };
}

export default async function Page() {
    const t = await getTranslations("Billing");
    return (
        <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
            <div className="text-center mb-10">
                <h1 className="text-title-sm font-bold mb-3">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
                <p className="text-muted-foreground mt-2">
                    {t.rich("loginPrompt", {
                        login: (chunks) => (
                            <Link href="/login" className="underline">
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            </div>
            <PricingGrid />
        </div>
    );
}
