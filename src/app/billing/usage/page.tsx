import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getUsageDaily } from "@/modules/creem/services/usage.service";

export async function generateMetadata(): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { billingUsage } = context.messages;
    return createMetadata(context, {
        path: "/billing/usage",
        title: billingUsage.title,
        description: billingUsage.description,
        robots: { index: false, follow: false },
    });
}

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default async function UsagePage() {
    const t = await getTranslations("BillingUsage");
    const auth = await getAuthInstance();
    const session = await auth.api.getSession({
        headers: new Headers(await headers()),
    });
    if (!session?.user) {
        return (
            <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
                <h1 className="text-title-sm font-bold mb-3">
                    {t("loginRequiredTitle")}
                </h1>
                <p className="text-muted-foreground">
                    {t("loginRequiredMessage")}
                </p>
            </div>
        );
    }

    const end = new Date();
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    const fromDate = formatDate(start);
    const toDate = formatDate(end);
    const rows = await getUsageDaily(session.user.id, fromDate, toDate);

    // 按日期→feature 分组
    const byDate: Record<
        string,
        { feature: string; total: number; unit: string }[]
    > = {};
    for (const r of rows) {
        byDate[r.date] ||= [];
        byDate[r.date].push({
            feature: r.feature,
            total: r.totalAmount,
            unit: r.unit,
        });
    }
    const sortedDates = Object.keys(byDate).sort();

    return (
        <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
            <h1 className="text-title-sm font-bold mb-6">{t("title")}</h1>
            <div className="space-y-4">
                {sortedDates.length === 0 ? (
                    <p className="text-muted-foreground">{t("empty")}</p>
                ) : (
                    sortedDates.map((d) => (
                        <div key={d} className="border rounded p-4">
                            <div className="font-semibold mb-2">{d}</div>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                {byDate[d].map((it) => (
                                    <li key={`${d}-${it.feature}-${it.unit}`}>
                                        {t("entry", {
                                            feature: it.feature,
                                            total: it.total,
                                            unit: it.unit,
                                        })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
