import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import {
    createFallbackConfig,
    type StaticConfigFallbackOptions,
    type StaticSiteConfig,
} from "@/lib/static-config";

const OUTPUT_ROOT = path.join(process.cwd(), "config", "static");
const DEFAULT_BASE_URL = "http://localhost:3000";

type WriteContext = {
    baseUrl: string;
};

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

async function fetchConfigs(baseUrl: string, token: string) {
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
    const json = (await response.json()) as Record<AppLocale, StaticSiteConfig>;
    return json;
}

async function writeConfig(locale: AppLocale, config: StaticSiteConfig) {
    await fs.mkdir(OUTPUT_ROOT, { recursive: true });
    const filePath = path.join(OUTPUT_ROOT, `${locale}.json`);
    const payload = JSON.stringify(config, null, 2);
    await fs.writeFile(filePath, payload, "utf-8");
}

function createFallbackConfigs(
    context: WriteContext,
    options: StaticConfigFallbackOptions = {},
) {
    const entries = supportedLocales.map(
        (locale) =>
            [
                locale,
                createFallbackConfig(locale, {
                    baseUrl: context.baseUrl,
                    ...options,
                }),
            ] as const,
    );
    return Object.fromEntries(entries) as Record<AppLocale, StaticSiteConfig>;
}

async function writeFallbackConfigs(context: WriteContext) {
    console.warn(
        "Static site export skipped; generating fallback configs from bundled messages.",
    );
    const configs = createFallbackConfigs(context);
    for (const locale of supportedLocales) {
        await writeConfig(locale, configs[locale]);
    }
}

async function main() {
    const baseUrl = resolveBaseUrl();
    const token = resolveToken();
    if (!token) {
        await writeFallbackConfigs({ baseUrl });
        return;
    }

    try {
        const configs = await fetchConfigs(baseUrl, token);
        const missingLocales: AppLocale[] = [];
        for (const locale of supportedLocales) {
            const config = configs[locale];
            if (!config) {
                missingLocales.push(locale);
                const fallback = createFallbackConfig(locale, { baseUrl });
                await writeConfig(locale, fallback);
                continue;
            }
            await writeConfig(locale, config);
        }
        if (missingLocales.length) {
            console.warn(
                `Export payload missing locales; generated fallback configs for: ${missingLocales.join(", ")}`,
            );
        }
    } catch (error) {
        console.warn(
            "Failed to export static site settings, generating fallback configs instead.",
            error,
        );
        await writeFallbackConfigs({ baseUrl });
    }
}

void main().catch((error) => {
    console.error("Unexpected error while writing static site settings", error);
    process.exit(1);
});
