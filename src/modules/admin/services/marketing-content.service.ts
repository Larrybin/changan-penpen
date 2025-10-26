import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import {
    getDb,
    marketingContentAudit,
    marketingContentDrafts,
    marketingContentVersions,
} from "@/db";
import {
    type AppLocale,
    getDefaultLocale,
    getSupportedAppLocales,
} from "@/i18n/config";
import {
    clearStaticConfigCache,
    createFallbackConfig,
    createFallbackMarketingSection,
    loadMarketingSection,
    MARKETING_SECTIONS,
    type MarketingSection,
} from "@/lib/static-config";
import {
    type MarketingSectionFileInput,
    marketingSectionFileSchema,
} from "@/modules/admin/schemas/marketing-content.schema";
import { recordAdminAuditLog } from "@/modules/admin/services/system-audit.service";

const STATIC_ROOT = path.join(process.cwd(), "config", "static");
const MARKETING_ROOT = path.join(STATIC_ROOT, "marketing");
const PREVIEW_TOKEN_TTL_MS = 1000 * 60 * 60; // 60 minutes

const SUPPORTED_LOCALE_SET = new Set(getSupportedAppLocales());
const SUPPORTED_SECTIONS = new Set<string>(MARKETING_SECTIONS);

function assertLocale(value: string): AppLocale {
    const trimmed = value.trim();
    if (!SUPPORTED_LOCALE_SET.has(trimmed as AppLocale)) {
        throw new Error(`Unsupported locale: ${value}`);
    }
    return trimmed as AppLocale;
}

function assertSection(value: string): MarketingSection {
    const trimmed = value.trim();
    if (!SUPPORTED_SECTIONS.has(trimmed)) {
        throw new Error(`Unsupported marketing section: ${value}`);
    }
    return trimmed as MarketingSection;
}

function parsePayload(raw: string): MarketingSectionFileInput {
    try {
        const parsed = JSON.parse(raw) as unknown;
        return marketingSectionFileSchema.parse(parsed);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("Stored marketing payload is not valid JSON");
        }
        throw error;
    }
}

async function loadFallbackPayload(
    locale: AppLocale,
    section: MarketingSection,
): Promise<MarketingSectionFileInput> {
    const file = await loadMarketingSection(locale, section).catch(() =>
        createFallbackMarketingSection(locale, section),
    );
    return marketingSectionFileSchema.parse(file);
}

function serializePayload(payload: MarketingSectionFileInput) {
    return JSON.stringify(payload);
}

async function ensureDirectory(directory: string) {
    await fs.mkdir(directory, { recursive: true });
}

function computeMetadataVersion(
    locale: AppLocale,
    section: MarketingSection,
    version: number,
) {
    return `marketing:${locale}:${section}:v${version}`;
}

async function writeSectionFile(
    locale: AppLocale,
    section: MarketingSection,
    payload: MarketingSectionFileInput,
) {
    await ensureDirectory(path.join(MARKETING_ROOT, locale));
    const filePath = path.join(MARKETING_ROOT, locale, `${section}.json`);
    const content = `${JSON.stringify(payload, null, 2)}\n`;
    await fs.writeFile(filePath, content, "utf-8");
}

async function readStaticConfigFile(locale: AppLocale) {
    const filePath = path.join(STATIC_ROOT, `${locale}.json`);
    try {
        const raw = await fs.readFile(filePath, "utf-8");
        return JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code === "ENOENT") {
                return createFallbackConfig(locale) as Record<string, unknown>;
            }
        }
        throw error;
    }
}

async function writeStaticConfigFile(
    locale: AppLocale,
    config: Record<string, unknown>,
) {
    await ensureDirectory(STATIC_ROOT);
    const filePath = path.join(STATIC_ROOT, `${locale}.json`);
    const content = `${JSON.stringify(config, null, 2)}\n`;
    await fs.writeFile(filePath, content, "utf-8");
}

function updateStaticConfigMetadata(
    config: Record<string, unknown>,
    metadataVersion: string,
    publishedAt: string,
) {
    const metadata = (config.metadata ?? {}) as Record<string, unknown>;
    metadata.version = metadataVersion;
    metadata.updatedAt = publishedAt;
    if (!metadata.baseUrl) {
        metadata.baseUrl = "http://localhost:3000";
    }
    config.metadata = metadata;
}

function updateMarketingSummary(
    config: Record<string, unknown>,
    section: MarketingSection,
    payload: MarketingSectionFileInput,
) {
    const marketing = (config.marketing ?? {}) as Record<string, unknown>;
    const sections = (marketing.sections ?? {}) as Record<string, unknown>;
    const variants = (marketing.variants ?? {}) as Record<string, unknown>;

    const sectionSummary = (sections[section] ?? {}) as Record<string, unknown>;
    sectionSummary.defaultVariant = payload.defaultVariant;
    sections[section] = sectionSummary;
    variants[section] = Object.keys(payload.variants ?? {});

    marketing.sections = sections;
    marketing.variants = variants;
    config.marketing = marketing;
}

async function persistPublishedPayload(
    locale: AppLocale,
    section: MarketingSection,
    payload: MarketingSectionFileInput,
    version: number,
    publishedAt: string,
) {
    await writeSectionFile(locale, section, payload);
    const config = await readStaticConfigFile(locale);
    const metadataVersion = computeMetadataVersion(locale, section, version);
    updateStaticConfigMetadata(config, metadataVersion, publishedAt);
    updateMarketingSummary(config, section, payload);
    await writeStaticConfigFile(locale, config);
    clearStaticConfigCache();
    return metadataVersion;
}

export type MarketingContentMetadata = {
    locales: readonly AppLocale[];
    sections: readonly MarketingSection[];
    defaultLocale: AppLocale;
};

export type MarketingContentDraft = {
    locale: AppLocale;
    section: MarketingSection;
    payload: MarketingSectionFileInput;
    status: string;
    version: number;
    lastPublishedVersion: number | null;
    updatedAt: string | null;
    updatedBy: string | null;
    previewToken: string | null;
    previewTokenExpiresAt: string | null;
};

function mapDraftRow(
    locale: AppLocale,
    section: MarketingSection,
    payload: MarketingSectionFileInput,
    row: (typeof marketingContentDrafts)["$inferSelect"] | undefined,
    lastPublishedVersion: number | null,
): MarketingContentDraft {
    if (!row) {
        return {
            locale,
            section,
            payload,
            status: "published",
            version: 1,
            lastPublishedVersion,
            updatedAt: null,
            updatedBy: null,
            previewToken: null,
            previewTokenExpiresAt: null,
        };
    }

    return {
        locale,
        section,
        payload,
        status: row.status,
        version: row.version,
        lastPublishedVersion: row.lastPublishedVersion ?? lastPublishedVersion,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
        previewToken: row.previewToken ?? null,
        previewTokenExpiresAt: row.previewTokenExpiresAt ?? null,
    } satisfies MarketingContentDraft;
}

export async function getMarketingContentMetadata(): Promise<MarketingContentMetadata> {
    return {
        locales: getSupportedAppLocales(),
        sections: MARKETING_SECTIONS,
        defaultLocale: getDefaultLocale(),
    };
}

async function getLatestPublishedVersion(
    locale: AppLocale,
    section: MarketingSection,
) {
    const db = await getDb();
    const [result] = await db
        .select({
            maxVersion: sql<number>`coalesce(max(${marketingContentVersions.version}), 0)`,
        })
        .from(marketingContentVersions)
        .where(
            and(
                eq(marketingContentVersions.locale, locale),
                eq(marketingContentVersions.section, section),
            ),
        );
    return result?.maxVersion ?? 0;
}

export async function getMarketingContentDraft(
    localeInput: string,
    sectionInput: string,
): Promise<MarketingContentDraft> {
    const locale = assertLocale(localeInput);
    const section = assertSection(sectionInput);
    const db = await getDb();
    const [row] = await db
        .select()
        .from(marketingContentDrafts)
        .where(
            and(
                eq(marketingContentDrafts.locale, locale),
                eq(marketingContentDrafts.section, section),
            ),
        )
        .limit(1);

    const payload = row
        ? parsePayload(row.payload)
        : await loadFallbackPayload(locale, section);
    const lastPublishedVersion = await getLatestPublishedVersion(
        locale,
        section,
    );
    return mapDraftRow(locale, section, payload, row, lastPublishedVersion);
}

export interface UpsertMarketingContentDraftInput {
    locale: string;
    section: string;
    payload: unknown;
    adminEmail: string;
}

export async function upsertMarketingContentDraft(
    input: UpsertMarketingContentDraftInput,
): Promise<MarketingContentDraft> {
    const locale = assertLocale(input.locale);
    const section = assertSection(input.section);
    const parsedPayload = marketingSectionFileSchema.parse(input.payload);
    const payload = serializePayload(parsedPayload);
    const now = new Date().toISOString();

    const db = await getDb();
    await db
        .insert(marketingContentDrafts)
        .values({
            locale,
            section,
            payload,
            status: "draft",
            version: 1,
            lastPublishedVersion: null,
            updatedBy: input.adminEmail,
            createdAt: now,
            updatedAt: now,
            previewToken: null,
            previewTokenExpiresAt: null,
        })
        .onConflictDoUpdate({
            target: [
                marketingContentDrafts.locale,
                marketingContentDrafts.section,
            ],
            set: {
                payload,
                status: "draft",
                version: sql`${marketingContentDrafts.version} + 1`,
                updatedBy: input.adminEmail,
                updatedAt: now,
                previewToken: null,
                previewTokenExpiresAt: null,
            },
        });

    await db.insert(marketingContentAudit).values({
        locale,
        section,
        action: "draft.saved",
        message: "草稿已保存",
        actor: input.adminEmail,
        createdAt: now,
    });

    await recordAdminAuditLog({
        adminEmail: input.adminEmail,
        action: "marketing-content:save",
        targetType: "marketing-content",
        targetId: `${locale}:${section}`,
    });

    const latestPublishedVersion = await getLatestPublishedVersion(
        locale,
        section,
    );
    const [row] = await db
        .select()
        .from(marketingContentDrafts)
        .where(
            and(
                eq(marketingContentDrafts.locale, locale),
                eq(marketingContentDrafts.section, section),
            ),
        )
        .limit(1);

    return mapDraftRow(
        locale,
        section,
        row,
        parsedPayload,
        latestPublishedVersion,
    );
}

export interface GeneratePreviewTokenInput {
    locale: string;
    section: string;
    adminEmail: string;
}

export async function generatePreviewToken(input: GeneratePreviewTokenInput) {
    const locale = assertLocale(input.locale);
    const section = assertSection(input.section);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PREVIEW_TOKEN_TTL_MS);
    const token = randomUUID();

    const db = await getDb();
    const [existing] = await db
        .select({ id: marketingContentDrafts.id })
        .from(marketingContentDrafts)
        .where(
            and(
                eq(marketingContentDrafts.locale, locale),
                eq(marketingContentDrafts.section, section),
            ),
        )
        .limit(1);

    if (!existing) {
        throw new Error("Cannot generate preview for empty draft");
    }

    await db
        .update(marketingContentDrafts)
        .set({
            previewToken: token,
            previewTokenExpiresAt: expiresAt.toISOString(),
            updatedAt: now.toISOString(),
        })
        .where(eq(marketingContentDrafts.id, existing.id));

    await db.insert(marketingContentAudit).values({
        locale,
        section,
        action: "draft.preview",
        message: "生成预览链接",
        metadata: JSON.stringify({ expiresAt: expiresAt.toISOString() }),
        actor: input.adminEmail,
        createdAt: now.toISOString(),
    });

    await recordAdminAuditLog({
        adminEmail: input.adminEmail,
        action: "marketing-content:preview",
        targetType: "marketing-content",
        targetId: `${locale}:${section}`,
    });

    return {
        token,
        expiresAt: expiresAt.toISOString(),
    };
}

export interface PublishMarketingContentInput {
    locale: string;
    section: string;
    adminEmail: string;
}

export async function publishMarketingContent(
    input: PublishMarketingContentInput,
) {
    const locale = assertLocale(input.locale);
    const section = assertSection(input.section);
    const db = await getDb();

    const [draft] = await db
        .select()
        .from(marketingContentDrafts)
        .where(
            and(
                eq(marketingContentDrafts.locale, locale),
                eq(marketingContentDrafts.section, section),
            ),
        )
        .limit(1);

    const payload = draft
        ? parsePayload(draft.payload)
        : await loadFallbackPayload(locale, section);

    if (!draft) {
        throw new Error("No draft available to publish. Please save first.");
    }

    const lastVersion = await getLatestPublishedVersion(locale, section);
    const nextVersion = lastVersion + 1;
    const publishedAt = new Date().toISOString();
    const serialized = serializePayload(payload);

    const metadataVersion = await persistPublishedPayload(
        locale,
        section,
        payload,
        nextVersion,
        publishedAt,
    );

    await db.insert(marketingContentVersions).values({
        locale,
        section,
        version: nextVersion,
        payload: serialized,
        metadataVersion,
        createdBy: input.adminEmail,
        createdAt: publishedAt,
    });

    await db
        .update(marketingContentDrafts)
        .set({
            status: "published",
            lastPublishedVersion: nextVersion,
            previewToken: null,
            previewTokenExpiresAt: null,
            updatedAt: publishedAt,
            updatedBy: input.adminEmail,
        })
        .where(
            and(
                eq(marketingContentDrafts.locale, locale),
                eq(marketingContentDrafts.section, section),
            ),
        );

    await db.insert(marketingContentAudit).values({
        locale,
        section,
        action: "draft.published",
        message: `发布版本 ${nextVersion}`,
        metadata: JSON.stringify({ metadataVersion }),
        actor: input.adminEmail,
        version: nextVersion,
        createdAt: publishedAt,
    });

    await recordAdminAuditLog({
        adminEmail: input.adminEmail,
        action: "marketing-content:publish",
        targetType: "marketing-content",
        targetId: `${locale}:${section}:v${nextVersion}`,
        metadata: JSON.stringify({ metadataVersion }),
    });

    return {
        locale,
        section,
        version: nextVersion,
        metadataVersion,
        publishedAt,
    };
}

export async function cleanupExpiredPreviewTokens() {
    const db = await getDb();
    const now = new Date().toISOString();
    await db
        .update(marketingContentDrafts)
        .set({ previewToken: null, previewTokenExpiresAt: null })
        .where(
            and(
                isNotNull(marketingContentDrafts.previewToken),
                lt(marketingContentDrafts.previewTokenExpiresAt, now),
            ),
        );
}
