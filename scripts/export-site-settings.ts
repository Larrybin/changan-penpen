import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import type { StaticSiteConfig } from "@/lib/static-config";

const OUTPUT_ROOT = path.join(process.cwd(), "config", "static");
const DEFAULT_BASE_URL = "http://localhost:3000";

function resolveBaseUrl(): string {
    const candidate =
        process.env.STATIC_EXPORT_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (candidate?.trim().length) {
        return candidate.trim();
    }
    return DEFAULT_BASE_URL;
}

function getToken(): string {
    const token = process.env.STATIC_EXPORT_TOKEN ?? "";
    if (!token.trim().length) {
        throw new Error(
            "STATIC_EXPORT_TOKEN is required to export static site settings.",
        );
    }
    return token.trim();
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

async function main() {
    const baseUrl = resolveBaseUrl();
    const token = getToken();
    const configs = await fetchConfigs(baseUrl, token);
    const missingLocales: AppLocale[] = [];
    for (const locale of supportedLocales) {
        const config = configs[locale];
        if (!config) {
            missingLocales.push(locale);
            continue;
        }
        await writeConfig(locale, config);
    }
    if (missingLocales.length) {
        throw new Error(
            `Export payload missing locales: ${missingLocales.join(", ")}`,
        );
    }
}

void main().catch((error) => {
    console.error("Failed to export static site settings", error);
    process.exit(1);
});
