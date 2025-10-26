import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { type AppLocale, supportedLocales } from "@/i18n/config";

const STATIC_ROOT = path.join(process.cwd(), "config", "static");

export type StaticSiteConfig = {
    locale: AppLocale;
    metadata: {
        baseUrl: string;
        siteName: string;
        ogImage: string;
        structuredData: Record<string, unknown>;
    };
    messages: {
        Marketing: Record<string, unknown>;
        StaticPages: Record<string, unknown>;
    };
};

const cache = new Map<AppLocale, StaticSiteConfig>();

function assertLocale(locale: AppLocale): AppLocale {
    if (!supportedLocales.includes(locale)) {
        throw new Error(`Unsupported locale: ${locale}`);
    }
    return locale;
}

function readConfigFileSync(locale: AppLocale): StaticSiteConfig {
    const cached = cache.get(locale);
    if (cached) {
        return cached;
    }
    const file = path.join(STATIC_ROOT, `${locale}.json`);
    const raw = readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as StaticSiteConfig;
    cache.set(locale, parsed);
    return parsed;
}

export async function loadStaticConfig(locale: AppLocale) {
    const normalized = assertLocale(locale);
    const cached = cache.get(normalized);
    if (cached) {
        return cached;
    }
    const file = path.join(STATIC_ROOT, `${normalized}.json`);
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as StaticSiteConfig;
    cache.set(normalized, parsed);
    return parsed;
}

export function loadStaticConfigSync(locale: AppLocale) {
    const normalized = assertLocale(locale);
    return readConfigFileSync(normalized);
}
