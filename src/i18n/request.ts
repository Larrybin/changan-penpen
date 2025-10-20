import { getRequestConfig } from "next-intl/server";

import { getDefaultLocale, resolveAppLocale } from "./config";

export default getRequestConfig(async ({ locale, requestLocale }) => {
    const defaultLocale = getDefaultLocale();

    const requestedLocale =
        typeof locale === "string" && locale.trim().length > 0
            ? locale
            : await requestLocale;
    const candidate = requestedLocale ?? defaultLocale;
    const resolved = resolveAppLocale(candidate);

    return {
        locale: resolved,
        messages: (await import(`./messages/${resolved}.json`)).default,
    };
});
