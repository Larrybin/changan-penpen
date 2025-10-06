import { getRequestConfig } from "next-intl/server";

import type { AppLocale } from "./config";
import { defaultLocale, locales } from "./config";

export default getRequestConfig(async ({ locale, requestLocale }) => {
    const isAppLocale = (value: string): value is AppLocale =>
        (locales as readonly AppLocale[]).includes(value as AppLocale);

    const requestedLocale =
        typeof locale === "string" && locale.trim().length > 0
            ? locale
            : await requestLocale;
    const candidate = requestedLocale ?? defaultLocale;
    const resolved = isAppLocale(candidate) ? candidate : defaultLocale;

    return {
        locale: resolved,
        messages: (await import(`./messages/${resolved}.json`)).default,
    };
});
