import {
    index,
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { z } from "zod";

export const marketingContentDrafts = sqliteTable(
    "marketing_content_drafts",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        locale: text("locale").notNull(),
        section: text("section").notNull(),
        payload: text("payload").notNull(),
        status: text("status").notNull().default("draft"),
        version: integer("version").notNull().default(1),
        lastPublishedVersion: integer("last_published_version"),
        previewToken: text("preview_token"),
        previewTokenExpiresAt: text("preview_token_expires_at"),
        updatedBy: text("updated_by"),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
    },
    (table) => ({
        uniqueLocaleSection: uniqueIndex(
            "marketing_content_drafts_locale_section_idx",
        ).on(table.locale, table.section),
        previewTokenIdx: uniqueIndex(
            "marketing_content_drafts_preview_token_idx",
        ).on(table.previewToken),
    }),
);

export const marketingContentVersions = sqliteTable(
    "marketing_content_versions",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        locale: text("locale").notNull(),
        section: text("section").notNull(),
        version: integer("version").notNull(),
        payload: text("payload").notNull(),
        metadataVersion: text("metadata_version"),
        createdBy: text("created_by"),
        createdAt: text("created_at").notNull(),
    },
    (table) => ({
        uniqueLocaleSectionVersion: uniqueIndex(
            "marketing_content_versions_locale_section_version_idx",
        ).on(table.locale, table.section, table.version),
        localeSectionIdx: index(
            "marketing_content_versions_locale_section_idx",
        ).on(table.locale, table.section),
    }),
);

export const marketingContentAudit = sqliteTable(
    "marketing_content_audit",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        locale: text("locale").notNull(),
        section: text("section").notNull(),
        action: text("action").notNull(),
        message: text("message"),
        metadata: text("metadata"),
        actor: text("actor"),
        version: integer("version"),
        createdAt: text("created_at").notNull(),
    },
    (table) => ({
        localeSectionIdx: index(
            "marketing_content_audit_locale_section_idx",
        ).on(table.locale, table.section),
    }),
);

const marketingVariantSchema = z.record(z.string(), z.unknown());

export const marketingSectionFileSchema = z
    .object({
        defaultVariant: z
            .string()
            .min(1, { message: "defaultVariant must not be empty" }),
        variants: marketingVariantSchema.refine(
            (value) => Object.keys(value ?? {}).length > 0,
            {
                message: "variants must include at least one entry",
            },
        ),
    })
    .superRefine((value, ctx) => {
        if (!value.variants[value.defaultVariant]) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "defaultVariant must reference an existing variant",
                path: ["defaultVariant"],
            });
        }
    });

export type MarketingSectionFileInput = z.infer<
    typeof marketingSectionFileSchema
>;
