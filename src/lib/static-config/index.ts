import { readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import deMessages from "@/i18n/messages/de.json";
import enMessages from "@/i18n/messages/en.json";
import frMessages from "@/i18n/messages/fr.json";
import ptMessages from "@/i18n/messages/pt.json";

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

type LocaleMessages = Record<string, unknown>;

const FALLBACK_MESSAGES: Record<AppLocale, LocaleMessages> = {
    de: deMessages,
    en: enMessages,
    fr: frMessages,
    pt: ptMessages,
};

function createFallbackConfig(locale: AppLocale): StaticSiteConfig {
    const messages = FALLBACK_MESSAGES[locale];
    const metadataMessages = (messages.Metadata ?? {}) as Record<
        string,
        unknown
    >;
    const openGraph = (metadataMessages.openGraph ?? {}) as Record<
        string,
        unknown
    >;
    const marketingMessages = (messages.Marketing ?? {}) as Record<
        string,
        unknown
    >;
    const staticPagesMessages = (messages.StaticPages ?? {}) as Record<
        string,
        unknown
    >;
    return {
        locale,
        metadata: {
            baseUrl: "",
            siteName:
                typeof openGraph.siteName === "string"
                    ? (openGraph.siteName as string)
                    : "Banana Generator",
            ogImage: "",
            structuredData: {},
        },
        messages: {
            Marketing: marketingMessages,
            StaticPages: staticPagesMessages,
        },
    } satisfies StaticSiteConfig;
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
    );
}

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
    try {
        const raw = readFileSync(file, "utf-8");
        const parsed = JSON.parse(raw) as StaticSiteConfig;
        cache.set(locale, parsed);
        return parsed;
    } catch (error) {
        if (isMissingFileError(error)) {
            const fallback = createFallbackConfig(locale);
            cache.set(locale, fallback);
            return fallback;
        }
        throw error;
    }
}

export async function loadStaticConfig(locale: AppLocale) {
    const normalized = assertLocale(locale);
    const cached = cache.get(normalized);
    if (cached) {
        return cached;
    }
    const file = path.join(STATIC_ROOT, `${normalized}.json`);
    try {
        const raw = await fs.readFile(file, "utf-8");
        const parsed = JSON.parse(raw) as StaticSiteConfig;
        cache.set(normalized, parsed);
        return parsed;
    } catch (error) {
        if (isMissingFileError(error)) {
            const fallback = createFallbackConfig(normalized);
            cache.set(normalized, fallback);
            return fallback;
        }
        throw error;
    }
}

export function loadStaticConfigSync(locale: AppLocale) {
    const normalized = assertLocale(locale);
    return readConfigFileSync(normalized);
}
