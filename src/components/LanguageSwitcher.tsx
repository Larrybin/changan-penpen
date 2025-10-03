"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next-intl/navigation";
import { useMemo } from "react";

import type { AppLocale } from "@/i18n/config";

const LABELS: Record<AppLocale, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    pt: "Português",
};

export default function LanguageSwitcher() {
    const locale = useLocale() as AppLocale;
    const pathname = usePathname();
    const router = useRouter();

    const options = useMemo(
        () =>
            (Object.keys(LABELS) as AppLocale[]).map((l) => ({
                value: l,
                label: LABELS[l],
            })),
        [],
    );

    return (
        <select
            value={locale}
            onChange={(e) =>
                router.replace(pathname, {
                    locale: e.target.value as AppLocale,
                })
            }
            className="border rounded-md px-2 py-1 text-sm bg-white"
            aria-label="Language selector"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
