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

type DiffAccumulator = Map<AppLocale, string[]>;

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
    if (flags.requireToken) {
        return true;
    }
    const ci = process.env.CI ?? "";
    return ci === "1" || ci.toLowerCase() === "true";
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

async function writeFileDiff(
    locale: AppLocale,
    relativePath: string,
    absolutePath: string,
    payload: string,
    diffAccumulator: DiffAccumulator,
) {
    let previous = "";
    try {
        previous = await fs.readFile(absolutePath, "utf-8");
        if (previous === payload) {
            return;
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }

    await fs.writeFile(absolutePath, payload, "utf-8");
    const diff = formatPseudoDiff(previous, payload);
    if (!diff) {
        return;
    }
    const entry = `# File: ${relativePath}\n${diff}`;
    const current = diffAccumulator.get(locale) ?? [];
    current.push(entry);
    diffAccumulator.set(locale, current);
}

function formatPseudoDiff(
    previousContent: string,
    nextContent: string,
): string | null {
    if (previousContent === nextContent) {
        return null;
    }
    const previousLines = previousContent.split("\n");
    const nextLines = nextContent.split("\n");
    const formatted = ["--- previous", "+++ next"];
    for (const line of previousLines) {
        if (line.length) {
            formatted.push(`- ${line}`);
        }
    }
    for (const line of nextLines) {
        if (line.length) {
            formatted.push(`+ ${line}`);
        }
    }
    return formatted.join("\n");
}

async function writeMarketingSections(
    locale: AppLocale,
    context: WriteContext,
    sections: Partial<Record<MarketingSection, MarketingSectionFile>>,
    diffAccumulator: DiffAccumulator,
) {
    const localeRoot = path.join(MARKETING_OUTPUT_ROOT, locale);
    await ensureDirectory(localeRoot);
    for (const section of MARKETING_SECTIONS) {
        const relativePath = path.join(
            "config/static/marketing",
            locale,
            `${section}.json`,
        );
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
        await writeFileDiff(
            locale,
            relativePath,
            absolutePath,
            payload,
            diffAccumulator,
        );
    }
}

async function writeStaticConfig(
    locale: AppLocale,
    config: StaticSiteConfig,
    context: WriteContext,
    sections: Partial<Record<MarketingSection, MarketingSectionFile>>,
    diffAccumulator: DiffAccumulator,
) {
    await ensureDirectory(OUTPUT_ROOT);
    const normalizedConfig = applyMetadataDefaults(config, context);
    const filePath = path.join(OUTPUT_ROOT, `${locale}.json`);
    const relative = path.join("config/static", `${locale}.json`);
    const payload = `${JSON.stringify(normalizedConfig, null, 2)}\n`;
    await writeFileDiff(locale, relative, filePath, payload, diffAccumulator);
    await writeMarketingSections(locale, context, sections, diffAccumulator);
}

async function writeFallbackConfigs(context: WriteContext) {
    console.warn(
        "[static-export] Falling back to bundled messages for static site config generation.",
    );
    const diffAccumulator: DiffAccumulator = new Map();
    for (const locale of supportedLocales) {
        const config = createFallbackConfig(locale, context);
        await writeStaticConfig(locale, config, context, {}, diffAccumulator);
    }
    await flushDiffReports(diffAccumulator);
}

async function flushDiffReports(diffAccumulator: DiffAccumulator) {
    if (!diffAccumulator.size) {
        return;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const diffRoot = path.join(OUTPUT_ROOT, "diff", timestamp);
    await ensureDirectory(diffRoot);
    for (const [locale, entries] of diffAccumulator.entries()) {
        const filePath = path.join(diffRoot, `${locale}.diff`);
        const content = `${entries.join("\n\n")}\n`;
        await fs.writeFile(filePath, content, "utf-8");
    }
    /* biome-ignore lint/suspicious/noConsole: CLI progress output */
    console.log(
        `[static-export] Wrote diff reports for ${diffAccumulator.size} locale(s) to ${path.relative(process.cwd(), diffRoot)}`,
    );
}

async function runExport(flags: CliFlags) {
    const context = resolveWriteContext();
    const token = resolveToken();
    const requireToken = shouldRequireToken(flags);
    if (requireToken && !token) {
        console.error(
            "[static-export] STATIC_EXPORT_TOKEN is required in CI or when --require-token is specified.",
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
    const diffAccumulator: DiffAccumulator = new Map();

    try {
        const configs = await fetchConfigs(context.baseUrl, token);
        const missingLocales: AppLocale[] = [];
        for (const locale of supportedLocales) {
            const payload = configs[locale];
            if (!payload) {
                missingLocales.push(locale);
                const fallbackConfig = createFallbackConfig(locale, context);
                await writeStaticConfig(
                    locale,
                    fallbackConfig,
                    context,
                    {},
                    diffAccumulator,
                );
                continue;
            }
            const { marketingSections = {}, ...rest } = payload;
            await writeStaticConfig(
                locale,
                applyMetadataDefaults(rest, context),
                context,
                marketingSections,
                diffAccumulator,
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

    await flushDiffReports(diffAccumulator);
}

async function main() {
    const flags = parseCliFlags();
    await runExport(flags);
}

void main().catch((error) => {
    console.error("Unexpected error while writing static site settings", error);
    process.exit(1);
});
