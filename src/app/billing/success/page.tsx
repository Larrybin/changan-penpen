import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
    evaluateReturnRedirect,
    extractReturnDetails,
    type VerificationState,
} from "@/app/billing/status-verification";
import { Button } from "@/components/ui/button";
import { resolveAppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { billingSuccess } = context.messages;
    return createMetadata(context, {
        path: "/billing/success",
        title: billingSuccess.title,
        description: billingSuccess.description,
        robots: { index: false, follow: false },
    });
}

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

function resolveVerificationTone(state: VerificationState) {
    if (state === "verified") return "text-emerald-600";
    if (state === "missingSecret") return "text-amber-600";
    return "text-destructive";
}

export default async function Page({ searchParams }: PageProps) {
    const t = await getTranslations("BillingStatus.success");
    const verification = await evaluateReturnRedirect(searchParams, "success");
    const verificationMessage = t(`verification.${verification.state}`);
    const details = extractReturnDetails(verification.params);
    const detailEntries = (
        [
            {
                key: "requestId",
                label: t("fields.requestId"),
                value: details.requestId,
            },
            {
                key: "checkoutId",
                label: t("fields.checkoutId"),
                value: details.checkoutId,
            },
            {
                key: "status",
                label: t("fields.status"),
                value: details.status,
            },
            {
                key: "timestamp",
                label: t("fields.timestamp"),
                value: details.timestamp,
            },
        ] satisfies Array<{ key: string; label: string; value?: string }>
    ).filter((entry) => Boolean(entry.value));
    const showDetails =
        verification.state === "verified" && detailEntries.length > 0;

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
            <div className="rounded-lg border bg-card px-6 py-5 text-left space-y-4">
                <div className="space-y-2">
                    <h2 className="text-base font-semibold">
                        {t("verificationTitle")}
                    </h2>
                    <p
                        className={`text-sm ${resolveVerificationTone(verification.state)}`}
                    >
                        {verificationMessage}
                    </p>
                </div>
                {showDetails && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium">
                            {t("detailsHeading")}
                        </h3>
                        <dl className="space-y-2 text-sm">
                            {detailEntries.map((entry) => (
                                <div
                                    key={entry.key}
                                    className="flex items-start justify-between gap-4"
                                >
                                    <dt className="text-muted-foreground">
                                        {entry.label}
                                    </dt>
                                    <dd className="font-medium break-all text-right">
                                        {entry.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </div>
        </div>
    );
}
