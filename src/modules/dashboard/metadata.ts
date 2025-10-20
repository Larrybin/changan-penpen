import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { resolveAppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export async function generateDashboardTodosMetadata(
    path: string,
): Promise<Metadata> {
    const locale = resolveAppLocale(await getLocale());
    const context = await getMetadataContext(locale);
    const { dashboardTodos } = context.messages;

    return createMetadata(context, {
        path,
        title: dashboardTodos.title,
        description: dashboardTodos.description,
        robots: { index: false, follow: false },
    });
}
