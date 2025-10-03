import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales } from "./config";

export default getRequestConfig(async ({ locale, requestLocale }) => {
    const candidate = (locale as any) ?? (await requestLocale) ?? defaultLocale;
    const resolved = (locales as readonly string[]).includes(candidate as any)
        ? (candidate as any)
        : defaultLocale;

    return {
        locale: resolved,
        messages: (await import(`./messages/${resolved}.json`)).default,
    };
});
