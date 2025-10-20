export const supportedLocales = ["en", "de", "fr", "pt"] as const;

export type AppLocale = (typeof supportedLocales)[number];

type RuntimeI18nConfig = {
    locales: AppLocale[];
    defaultLocale: AppLocale;
};

type RuntimeConfigInput = {
    locales?: string[];
    defaultLocale?: string | null;
};

const SUPPORTED_LOCALE_SET = new Set<string>(supportedLocales);

function normalizeLocale(value: string | null | undefined): AppLocale | null {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return SUPPORTED_LOCALE_SET.has(trimmed) ? (trimmed as AppLocale) : null;
}

function parseLocales(input?: string[] | null): AppLocale[] {
    if (!input?.length) {
        return [];
    }
    const seen = new Set<AppLocale>();
    for (const candidate of input) {
        const normalized = normalizeLocale(candidate);
        if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
        }
    }
    return Array.from(seen);
}

function readEnvLocales(): AppLocale[] {
    const raw =
        process.env.NEXT_PUBLIC_I18N_LOCALES ??
        process.env.NEXT_PUBLIC_ENABLED_LANGUAGES ??
        "";
    if (!raw) {
        return [];
    }
    const segments = raw
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean);
    return parseLocales(segments);
}

function readEnvDefaultLocale(): AppLocale | null {
    const raw =
        process.env.NEXT_PUBLIC_I18N_DEFAULT_LOCALE ??
        process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE ??
        "";
    return normalizeLocale(raw);
}

function computeRuntimeConfig(input?: RuntimeConfigInput): RuntimeI18nConfig {
    const envLocales = readEnvLocales();
    const envDefault = readEnvDefaultLocale();
    const requestedLocales = parseLocales(input?.locales) || [];

    const requestedOrEnvLocales = requestedLocales.length
        ? requestedLocales
        : envLocales.length
          ? envLocales
          : Array.from(supportedLocales);

    const requestedDefault = normalizeLocale(input?.defaultLocale ?? null);
    const computedDefaultLocale =
        requestedDefault ??
        requestedOrEnvLocales[0] ??
        envDefault ??
        supportedLocales[0];

    const withDefault = requestedOrEnvLocales.includes(computedDefaultLocale)
        ? requestedOrEnvLocales
        : [computedDefaultLocale, ...requestedOrEnvLocales];

    const uniqueLocales = Array.from(new Set(withDefault)) as AppLocale[];

    return {
        locales: uniqueLocales,
        defaultLocale: computedDefaultLocale,
    };
}

let runtimeConfig: RuntimeI18nConfig = computeRuntimeConfig();

export let locales: AppLocale[] = runtimeConfig.locales;
export let defaultLocale: AppLocale = runtimeConfig.defaultLocale;

function applyRuntimeConfig(config: RuntimeI18nConfig): RuntimeI18nConfig {
    runtimeConfig = config;
    locales = config.locales;
    defaultLocale = config.defaultLocale;
    return runtimeConfig;
}

export function getRuntimeI18nConfig(): RuntimeI18nConfig {
    return runtimeConfig;
}

export function setRuntimeI18nConfig(
    input: RuntimeConfigInput,
): RuntimeI18nConfig {
    const computed = computeRuntimeConfig(input);
    return applyRuntimeConfig(computed);
}

export function getLocales(): AppLocale[] {
    return runtimeConfig.locales;
}

export function getDefaultLocale(): AppLocale {
    return runtimeConfig.defaultLocale;
}

export function getSupportedAppLocales(): readonly AppLocale[] {
    return supportedLocales;
}

export const localePrefix = "as-needed" as const; // no prefix for default locale
