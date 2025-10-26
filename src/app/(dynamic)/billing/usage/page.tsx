import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getUsageDaily } from "@/modules/creem/services/usage.service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
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
    const requestHeaders = await headers();

    const renderLoginPrompt = () => (
        <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-12">
            <h1 className="mb-3 font-bold text-title-sm">
                {t("loginRequiredTitle")}
            </h1>
            <p className="text-muted-foreground">{t("loginRequiredMessage")}</p>
        </div>
    );

    const renderUnavailable = () => (
        <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-12">
            <h1 className="mb-3 font-bold text-title-sm">
                {t("unavailableTitle")}
            </h1>
            <p className="text-muted-foreground">{t("unavailableMessage")}</p>
        </div>
    );

    let sessionUserId: string | null = null;

    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({
            headers: new Headers(requestHeaders),
        });

        if (!session?.user) {
            return renderLoginPrompt();
        }

        sessionUserId = session.user.id;
    } catch (error) {
        console.warn(
            "[billing/usage] Authentication backend unavailable; showing fallback",
            error,
        );
        return renderUnavailable();
    }

    const end = new Date();
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    const fromDate = formatDate(start);
    const toDate = formatDate(end);

    let rows: Awaited<ReturnType<typeof getUsageDaily>>;
    try {
        rows = await getUsageDaily(sessionUserId, fromDate, toDate);
    } catch (error) {
        console.warn(
            "[billing/usage] Failed to load usage records; showing fallback",
            { userId: sessionUserId, fromDate, toDate, error },
        );
        return renderUnavailable();
    }

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
    const sortedDates = Object.keys(byDate).sort((a, b) => {
        const timeA = new Date(a).getTime();
        const timeB = new Date(b).getTime();

        const aIsValid = !Number.isNaN(timeA);
        const bIsValid = !Number.isNaN(timeB);

        if (aIsValid && bIsValid) {
            return timeA - timeB;
        }
        if (aIsValid) {
            return -1;
        }
        if (bIsValid) {
            return 1;
        }
        return a.localeCompare(b);
    });

    return (
        <div className="mx-auto max-w-[var(--container-max-w)] px-[var(--container-px)] py-12">
            <h1 className="mb-6 font-bold text-title-sm">{t("title")}</h1>
            <div className="space-y-4">
                {sortedDates.length === 0 ? (
                    <p className="text-muted-foreground">{t("empty")}</p>
                ) : (
                    sortedDates.map((d) => (
                        <div key={d} className="rounded border p-4">
                            <div className="mb-2 font-semibold">{d}</div>
                            <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
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
