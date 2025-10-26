import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
    evaluateReturnRedirect,
    extractReturnDetails,
    type VerificationState,
} from "@/app/(dynamic)/billing/status-verification";
import { Button } from "@/components/ui/button";
import { resolveAppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { billingCancel } = context.messages;
    return createMetadata(context, {
        path: "/billing/cancel",
        title: billingCancel.title,
        description: billingCancel.description,
        robots: { index: false, follow: false },
    });
}

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveVerificationTone(state: VerificationState) {
    if (state === "verified") return "text-emerald-600";
    if (state === "missingSecret") return "text-amber-600";
    return "text-destructive";
}

export default async function Page({ searchParams }: PageProps) {
    const t = await getTranslations("BillingStatus.cancel");
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const verification = await evaluateReturnRedirect(
        resolvedSearchParams,
        "cancel",
    );
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
        <div className="mx-auto max-w-xl space-y-6 px-6 py-16 text-center">
            <h1 className="font-bold text-title-sm">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
            <div className="flex justify-center gap-3">
                <Link href="/billing">
                    <Button>{t("primaryCta")}</Button>
                </Link>
                <Link href={dashboardRoutes.dashboard}>
                    <Button variant="outline">{t("secondaryCta")}</Button>
                </Link>
            </div>
            <div className="space-y-4 rounded-lg border bg-card px-6 py-5 text-left">
                <div className="space-y-2">
                    <h2 className="font-semibold text-base">
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
                        <h3 className="font-medium text-sm">
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
                                    <dd className="break-all text-right font-medium">
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
