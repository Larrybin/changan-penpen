import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";
import Dashboard from "@/modules/dashboard/dashboard.page";

export async function generateMetadata(): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { dashboard } = context.messages;
    return createMetadata(context, {
        path: "/dashboard",
        title: dashboard.title,
        description: dashboard.description,
        robots: { index: false, follow: false },
    });
}

export default async function Page() {
    return <Dashboard />;
}
