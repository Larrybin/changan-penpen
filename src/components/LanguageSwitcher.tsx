"use client";

import { useLocale, useTranslations } from "next-intl";
import { createNavigation } from "next-intl/navigation";
import { useMemo } from "react";

import { resolveAppLocale } from "@/i18n/config";

const LABELS = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    pt: "Português",
} as const;

type SupportedLanguage = keyof typeof LABELS;

export default function LanguageSwitcher() {
    const locale = resolveAppLocale(useLocale());
    const tCommon = useTranslations("Common");
    const { usePathname, useRouter } = createNavigation();
    const pathname = usePathname();
    const router = useRouter();

    const options = useMemo(
        () =>
            (Object.keys(LABELS) as SupportedLanguage[]).map((value) => ({
                value,
                label: LABELS[value],
            })),
        [],
    );

    return (
        <select
            value={locale}
            onChange={(event) => {
                try {
                    const nextLocale = resolveAppLocale(event.target.value, {
                        fallbackToDefault: false,
                    });
                    router.replace(pathname, { locale: nextLocale });
                } catch (error) {
                    console.error("Attempted to switch to unsupported locale", {
                        value: event.target.value,
                        error,
                    });
                }
            }}
            className="border rounded-md px-2 py-1 text-sm bg-white"
            aria-label={tCommon("languageSwitcherLabel")}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
