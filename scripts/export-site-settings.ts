import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import {
    createFallbackConfig,
    createFallbackMarketingSection,
    MARKETING_SECTIONS,
    type MarketingSection,
    type MarketingSectionFile,
    type StaticSiteConfig,
} from "@/lib/static-config";

const OUTPUT_ROOT = path.join(process.cwd(), "config", "static");
const MARKETING_OUTPUT_ROOT = path.join(OUTPUT_ROOT, "marketing");
const DEFAULT_BASE_URL = "http://localhost:3000";

const ARG_REQUIRE_TOKEN = "--require-token";

type CliFlags = {
    requireToken: boolean;
};

type WriteContext = {
    baseUrl: string;
    version: string;
    updatedAt: string;
};

type RemoteLocalePayload = StaticSiteConfig & {
    marketingSections?: Partial<Record<MarketingSection, MarketingSectionFile>>;
};

function parseCliFlags(): CliFlags {
    const args = process.argv.slice(2);
    return {
        requireToken: args.includes(ARG_REQUIRE_TOKEN),
    } satisfies CliFlags;
}

function resolveBaseUrl(): string {
    const candidate =
        process.env.STATIC_EXPORT_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (candidate?.trim().length) {
        return candidate.trim();
    }
    return DEFAULT_BASE_URL;
}

function resolveToken(): string | null {
    const token = process.env.STATIC_EXPORT_TOKEN ?? "";
    const normalized = token.trim();
    return normalized.length > 0 ? normalized : null;
}

function resolveCommitSha(): string | null {
    const candidates = [
        process.env.STATIC_EXPORT_VERSION,
        process.env.GITHUB_SHA,
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.COMMIT_SHA,
    ];
    for (const candidate of candidates) {
        if (candidate?.trim().length) {
            return candidate.trim();
        }
    }
    try {
        const result = spawnSync("git", ["rev-parse", "HEAD"], {
            cwd: process.cwd(),
            stdio: ["ignore", "pipe", "ignore"],
            encoding: "utf-8",
        });
        if (result.status === 0 && result.stdout.trim().length) {
            return result.stdout.trim();
        }
    } catch {
        // Ignore git errors in minimal environments.
    }
    return null;
}

function resolveUpdatedAt(): string {
    const candidate = process.env.STATIC_EXPORT_UPDATED_AT ?? "";
    const normalized = candidate.trim();
    if (normalized.length && !Number.isNaN(Date.parse(normalized))) {
        return new Date(normalized).toISOString();
    }
    return new Date().toISOString();
}

function resolveWriteContext(): WriteContext {
    const baseUrl = resolveBaseUrl();
    const version = resolveCommitSha() ?? `local-${Date.now()}`;
    const updatedAt = resolveUpdatedAt();
    return { baseUrl, version, updatedAt } satisfies WriteContext;
}

function shouldRequireToken(flags: CliFlags): boolean {
    return flags.requireToken;
}

async function fetchConfigs(
    baseUrl: string,
    token: string,
): Promise<Record<AppLocale, RemoteLocalePayload>> {
    const url = new URL("/api/admin/site-settings/export", baseUrl);
    url.searchParams.set("token", token);
    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Failed to export static site settings (${response.status}): ${body}`,
        );
    }
    const json = (await response.json()) as Record<
        AppLocale,
        RemoteLocalePayload
    >;
    return json;
}

async function ensureDirectory(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

function applyMetadataDefaults(
    config: StaticSiteConfig,
    context: WriteContext,
): StaticSiteConfig {
    const metadata = config.metadata ?? {
        baseUrl: context.baseUrl,
        siteName: "",
        ogImage: "",
        structuredData: {},
        version: context.version,
        updatedAt: context.updatedAt,
    };
    if (!metadata.baseUrl?.trim().length) {
        metadata.baseUrl = context.baseUrl;
    }
    if (!metadata.version?.trim().length) {
        metadata.version = context.version;
    }
    if (!metadata.updatedAt?.trim().length) {
        metadata.updatedAt = context.updatedAt;
    }
    return {
        ...config,
        metadata,
    } satisfies StaticSiteConfig;
}

async function writeMarketingSections(
    locale: AppLocale,
    context: WriteContext,
    sections: Partial<Record<MarketingSection, MarketingSectionFile>>,
) {
    const localeRoot = path.join(MARKETING_OUTPUT_ROOT, locale);
    await ensureDirectory(localeRoot);
    for (const section of MARKETING_SECTIONS) {
        const absolutePath = path.join(localeRoot, `${section}.json`);
        const fallbackSection = createFallbackMarketingSection(
            locale,
            section,
            {
                baseUrl: context.baseUrl,
                version: context.version,
                updatedAt: context.updatedAt,
            },
        );
        const sectionPayload = sections?.[section] ?? fallbackSection;
        const payload = `${JSON.stringify(sectionPayload, null, 2)}\n`;
        await fs.writeFile(absolutePath, payload, "utf-8");
    }
}

async function writeStaticConfig(
    locale: AppLocale,
    config: StaticSiteConfig,
    context: WriteContext,
    sections: Partial<Record<MarketingSection, MarketingSectionFile>>,
) {
    await ensureDirectory(OUTPUT_ROOT);
    const normalizedConfig = applyMetadataDefaults(config, context);
    const filePath = path.join(OUTPUT_ROOT, `${locale}.json`);
    const payload = `${JSON.stringify(normalizedConfig, null, 2)}\n`;
    await fs.writeFile(filePath, payload, "utf-8");
    await writeMarketingSections(locale, context, sections);
}

async function writeFallbackConfigs(context: WriteContext) {
    console.warn(
        "[static-export] Falling back to bundled messages for static site config generation.",
    );
    for (const locale of supportedLocales) {
        const config = createFallbackConfig(locale, context);
        await writeStaticConfig(locale, config, context, {});
    }
}

async function runExport(flags: CliFlags) {
    const context = resolveWriteContext();
    const token = resolveToken();
    const requireToken = shouldRequireToken(flags);
    if (requireToken && !token) {
        console.error(
            "[static-export] STATIC_EXPORT_TOKEN is required when --require-token is specified.",
        );
        process.exit(1);
    }

    if (!token) {
        await writeFallbackConfigs(context);
        return;
    }

    /* biome-ignore lint/suspicious/noConsole: CLI progress output */
    console.log(
        `[static-export] Using remote export endpoint at ${context.baseUrl} for static config generation.`,
    );
    try {
        const configs = await fetchConfigs(context.baseUrl, token);
        const missingLocales: AppLocale[] = [];
        for (const locale of supportedLocales) {
            const payload = configs[locale];
            if (!payload) {
                missingLocales.push(locale);
                const fallbackConfig = createFallbackConfig(locale, context);
                await writeStaticConfig(locale, fallbackConfig, context, {});
                continue;
            }
            const { marketingSections = {}, ...rest } = payload;
            await writeStaticConfig(
                locale,
                applyMetadataDefaults(rest, context),
                context,
                marketingSections,
            );
        }
        if (missingLocales.length) {
            console.warn(
                `[static-export] Remote export response missing locales; generated fallback configs for: ${missingLocales.join(", ")}`,
            );
        }
    } catch (error) {
        console.warn(
            "[static-export] Remote export failed; generating fallback configs instead.",
            error,
        );
        await writeFallbackConfigs(context);
        return;
    }
}

async function main() {
    const flags = parseCliFlags();
    await runExport(flags);
}

void main().catch((error) => {
    console.error("Unexpected error while writing static site settings", error);
    process.exit(1);
});
