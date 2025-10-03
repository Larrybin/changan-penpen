export const locales = ["en", "de", "fr", "pt"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const localePrefix = "as-needed" as const; // no prefix for default locale
