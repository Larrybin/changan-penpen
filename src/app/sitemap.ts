import type { MetadataRoute } from "next";

import { defaultLocale, locales } from "@/i18n/config";

const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://www.bananagenerator.app";

const routes = [
    "",
    "login",
    "signup",
    "dashboard",
    "dashboard/todos",
    "billing",
    "billing/usage",
    "billing/success",
    "billing/cancel",
    "about",
    "contact",
    "privacy",
    "terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    return routes.flatMap((route) => {
        const basePath = route === "" ? "" : `/${route}`;
        const changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] =
            route === "" ? "daily" : "weekly";
        const priority = route === "" ? 1 : 0.6;

        return locales.map((locale) => {
            const isDefault = locale === defaultLocale;
            const localizedPath = isDefault
                ? basePath
                : `/${locale}${basePath}`;
            const pathname = localizedPath || "/";

            return {
                url: `${appUrl}${pathname}`,
                lastModified: now,
                changeFrequency,
                priority,
            } satisfies MetadataRoute.Sitemap[number];
        });
    });
}
