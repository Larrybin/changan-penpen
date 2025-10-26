import { and, eq, gt } from "drizzle-orm";

import {
    getDb,
    type MarketingSectionFileInput,
    marketingContentDrafts,
    marketingSectionFileSchema,
} from "@/db";
import type { AppLocale } from "@/i18n/config";
import { supportedLocales } from "@/i18n/config";
import { MARKETING_SECTIONS, type MarketingSection } from "@/lib/static-config";

const SUPPORTED_SECTIONS = new Set<string>(MARKETING_SECTIONS);

function isMarketingSection(value: string): value is MarketingSection {
    return SUPPORTED_SECTIONS.has(value);
}

const SUPPORTED_LOCALE_SET = new Set<AppLocale>(supportedLocales);

function isAppLocale(value: string): value is AppLocale {
    return SUPPORTED_LOCALE_SET.has(value as AppLocale);
}

export interface MarketingPreviewPayload {
    locale: AppLocale;
    section: MarketingSection;
    payload: MarketingSectionFileInput;
    expiresAt: string;
}

export async function getMarketingPreviewPayload(
    token: string,
): Promise<MarketingPreviewPayload | null> {
    const trimmed = token.trim();
    if (!trimmed) {
        return null;
    }

    const nowIso = new Date().toISOString();
    const db = await getDb();
    const [row] = await db
        .select()
        .from(marketingContentDrafts)
        .where(
            and(
                eq(marketingContentDrafts.previewToken, trimmed),
                gt(marketingContentDrafts.previewTokenExpiresAt, nowIso),
            ),
        )
        .limit(1);

    if (!row) {
        return null;
    }

    if (!isAppLocale(row.locale) || !isMarketingSection(row.section)) {
        return null;
    }

    const payload = marketingSectionFileSchema.parse(
        JSON.parse(row.payload) as unknown,
    );

    return {
        locale: row.locale,
        section: row.section,
        payload,
        expiresAt: row.previewTokenExpiresAt ?? nowIso,
    } satisfies MarketingPreviewPayload;
}
