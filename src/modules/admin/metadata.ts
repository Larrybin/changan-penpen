import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import type { AppLocale } from "@/i18n/config";
import { createMetadata, getMetadataContext } from "@/lib/seo-metadata";

export interface AdminMetadataOptions {
    path: string;
    title?: string;
    description?: string;
}

export async function generateAdminMetadata(
    options: AdminMetadataOptions,
): Promise<Metadata> {
    const locale = (await getLocale()) as AppLocale;
    const context = await getMetadataContext(locale);
    const { dashboard } = context.messages;

    const title = options.title?.trim().length
        ? options.title.trim()
        : dashboard.title;
    const description = options.description?.trim().length
        ? options.description.trim()
        : dashboard.description;

    return createMetadata(context, {
        path: options.path,
        title,
        description,
    });
}
