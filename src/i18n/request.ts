import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales } from "./config";

export default getRequestConfig(async ({ locale }) => {
    const resolved = locales.includes(locale as any) ? locale : defaultLocale;

    return {
        messages: (await import(`./messages/${resolved}.json`)).default,
    };
});
