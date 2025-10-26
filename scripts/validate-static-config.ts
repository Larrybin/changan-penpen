import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import {
    MARKETING_SECTIONS,
    type MarketingSection,
    type MarketingSectionFile,
    type StaticSiteConfig,
} from "@/lib/static-config";

const OUTPUT_ROOT = path.join(process.cwd(), "config", "static");
const MARKETING_ROOT = path.join(OUTPUT_ROOT, "marketing");
const ARG_PRINT = "--print";

const metadataSchema = z
    .object({
        baseUrl: z.string().url().or(z.string().min(1)),
        siteName: z.string().min(1, "metadata.siteName is required"),
        ogImage: z.string().min(1, "metadata.ogImage is required"),
        structuredData: z.union([
            z.array(z.unknown()),
            z.record(z.string(), z.unknown()),
        ]),
        version: z.string().min(1, "metadata.version is required"),
        updatedAt: z.string().min(1, "metadata.updatedAt is required"),
    })
    .strict();

const marketingSectionSummarySchema = z
    .object({
        defaultVariant: z.string().min(1),
        structuredData: z
            .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
            .optional(),
    })
    .strict();

const marketingSummarySchema = z
    .object({
        sections: z.object(
            Object.fromEntries(
                MARKETING_SECTIONS.map((section) => [
                    section,
                    marketingSectionSummarySchema,
                ]),
            ) as Record<MarketingSection, typeof marketingSectionSummarySchema>,
        ),
        variants: z.object(
            Object.fromEntries(
                MARKETING_SECTIONS.map((section) => [
                    section,
                    z.array(z.string().min(1)).nonempty(),
                ]),
            ) as Record<MarketingSection, z.ZodArray<z.ZodString>>,
        ),
    })
    .strict();

const messagesSchema = z
    .object({
        Marketing: z.record(z.string(), z.unknown()),
        StaticPages: z.record(z.string(), z.unknown()),
        Common: z.record(z.string(), z.unknown()),
    })
    .strict();

const configSchema = z
    .object({
        locale: z.string().min(1),
        metadata: metadataSchema,
        messages: messagesSchema,
        marketing: marketingSummarySchema,
    })
    .strict();

const marketingSectionFileSchema = z
    .object({
        defaultVariant: z.string().min(1),
        variants: z
            .record(z.string().min(1), z.unknown())
            .refine(
                (value) => Object.keys(value).length > 0,
                "marketing section must include at least one variant",
            ),
    })
    .strict();

type CliFlags = {
    printErrors: boolean;
};

type ValidationError = {
    locale: AppLocale;
    message: string;
};

function parseFlags(): CliFlags {
    const args = process.argv.slice(2);
    return {
        printErrors: args.includes(ARG_PRINT),
    } satisfies CliFlags;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
}

function validateUpdatedAt(updatedAt: string) {
    if (Number.isNaN(Date.parse(updatedAt))) {
        throw new Error("metadata.updatedAt must be a valid ISO date string");
    }
}

function ensureDefaultVariant(
    locale: AppLocale,
    section: MarketingSection,
    summary: z.infer<typeof marketingSectionSummarySchema>,
    file: MarketingSectionFile,
) {
    if (summary.defaultVariant !== file.defaultVariant) {
        throw new Error(
            `marketing.sections.${section}.defaultVariant must match marketing/${locale}/${section}.json`,
        );
    }
    if (!Object.hasOwn(file.variants, file.defaultVariant)) {
        throw new Error(
            `marketing/${locale}/${section}.json is missing the defaultVariant key '${file.defaultVariant}'`,
        );
    }
}

function ensureVariantCoverage(
    summaryVariants: string[],
    file: MarketingSectionFile,
) {
    const fileVariantKeys = Object.keys(file.variants);
    const missing = summaryVariants.filter(
        (variant) => !fileVariantKeys.includes(variant),
    );
    if (missing.length) {
        throw new Error(
            `marketing section variants missing definitions for: ${missing.join(", ")}`,
        );
    }
}

async function validateLocaleConfig(locale: AppLocale) {
    const errors: ValidationError[] = [];
    const filePath = path.join(OUTPUT_ROOT, `${locale}.json`);
    try {
        const config = configSchema.parse(
            await readJsonFile<StaticSiteConfig>(filePath),
        );
        if (config.locale !== locale) {
            errors.push({
                locale,
                message: `Locale mismatch: expected '${locale}' but found '${config.locale}'`,
            });
        }
        try {
            validateUpdatedAt(config.metadata.updatedAt);
        } catch (error) {
            errors.push({
                locale,
                message: (error as Error).message,
            });
        }

        for (const section of MARKETING_SECTIONS) {
            const sectionPath = path.join(
                MARKETING_ROOT,
                locale,
                `${section}.json`,
            );
            try {
                const sectionFile = marketingSectionFileSchema.parse(
                    await readJsonFile<MarketingSectionFile>(sectionPath),
                );
                ensureDefaultVariant(
                    locale,
                    section,
                    config.marketing.sections[section],
                    sectionFile,
                );
                ensureVariantCoverage(
                    config.marketing.variants[section],
                    sectionFile,
                );
            } catch (error) {
                errors.push({
                    locale,
                    message: `Section '${section}': ${(error as Error).message}`,
                });
            }
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            for (const issue of error.issues) {
                errors.push({
                    locale,
                    message: `Validation error at ${issue.path.join(".")}: ${issue.message}`,
                });
            }
        } else {
            errors.push({
                locale,
                message: (error as Error).message,
            });
        }
    }
    return errors;
}

async function main() {
    const flags = parseFlags();
    const failures: ValidationError[] = [];
    for (const locale of supportedLocales) {
        const localeErrors = await validateLocaleConfig(locale);
        failures.push(...localeErrors);
    }

    if (failures.length) {
        if (flags.printErrors) {
            for (const failure of failures) {
                console.error(
                    `[static-config] ${failure.locale}: ${failure.message}`,
                );
            }
        }
        console.error(
            `[static-config] Validation failed for ${failures.length} issue(s) across ${
                new Set(failures.map((failure) => failure.locale)).size
            } locale(s).`,
        );
        process.exit(1);
    }

    /* biome-ignore lint/suspicious/noConsole: CLI status output */
    console.log(
        `[static-config] Validation succeeded for ${supportedLocales.length} locale(s).`,
    );
}

void main().catch((error) => {
    console.error("Unexpected error while validating static config", error);
    process.exit(1);
});
