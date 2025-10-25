"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useId, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    type AppLocale,
    getSupportedAppLocales,
    isRuntimeLocale,
} from "@/i18n/config";
import { adminQueryKeys } from "@/lib/query/keys";
import { toast } from "@/lib/toast";
import { adminApiClient } from "@/modules/admin/api/client";

const SETTINGS_SKELETON_SECTION_KEYS = Array.from(
    { length: 4 },
    (_, index) => `site-settings-section-${index}`,
);
const SETTINGS_SKELETON_FIELD_KEYS = Array.from(
    { length: 2 },
    (_, index) => `site-settings-field-${index}`,
);

interface SiteSettingsState {
    siteName: string;
    domain: string;
    logoUrl: string;
    faviconUrl: string;
    seoTitle: string;
    seoDescription: string;
    seoOgImage: string;
    seoTitleLocalized: Partial<Record<AppLocale, string>>;
    seoDescriptionLocalized: Partial<Record<AppLocale, string>>;
    seoOgImageLocalized: Partial<Record<AppLocale, string>>;
    sitemapEnabled: boolean;
    robotsRules: string;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandFontFamily: string;
    headHtml: string;
    footerHtml: string;
    defaultLanguage: AppLocale;
    enabledLanguages: AppLocale[];
}

const defaultSettings: SiteSettingsState = {
    siteName: "",
    domain: "",
    logoUrl: "",
    faviconUrl: "",
    seoTitle: "",
    seoDescription: "",
    seoOgImage: "",
    seoTitleLocalized: {},
    seoDescriptionLocalized: {},
    seoOgImageLocalized: {},
    sitemapEnabled: true,
    robotsRules: "",
    brandPrimaryColor: "#2563eb",
    brandSecondaryColor: "#0f172a",
    brandFontFamily: "Inter",
    headHtml: "",
    footerHtml: "",
    defaultLanguage: "en",
    enabledLanguages: ["en"],
};

const SUPPORTED_LANGUAGES = getSupportedAppLocales();

const LANGUAGE_LABELS: Record<AppLocale, string> = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    pt: "Português (Brasil)",
};

function arraysShallowEqual<T>(left: T[], right: T[]) {
    if (left.length !== right.length) {
        return false;
    }
    return left.every((value, index) => value === right[index]);
}

function localizedMapsEqual(
    left: Partial<Record<AppLocale, string>>,
    right: Partial<Record<AppLocale, string>>,
) {
    const keys = new Set([
        ...Object.keys(left ?? {}),
        ...Object.keys(right ?? {}),
    ]);
    for (const key of keys) {
        if (
            (left as Record<string, string>)[key] !==
            (right as Record<string, string>)[key]
        ) {
            return false;
        }
    }
    return true;
}

function cloneLocalizedMap(
    map: Partial<Record<AppLocale, string>>,
): Partial<Record<AppLocale, string>> {
    return Object.fromEntries(
        Object.entries(map ?? {}).map(([locale, value]) => [
            locale,
            value ?? "",
        ]),
    ) as Partial<Record<AppLocale, string>>;
}

function setPartialValue<TKey extends keyof SiteSettingsState>(
    target: Partial<SiteSettingsState>,
    key: TKey,
    value: SiteSettingsState[TKey],
) {
    target[key] = value;
}

type LocalizedFieldKey =
    | "seoTitleLocalized"
    | "seoDescriptionLocalized"
    | "seoOgImageLocalized";

const LOCALIZED_FIELD_KEYS: LocalizedFieldKey[] = [
    "seoTitleLocalized",
    "seoDescriptionLocalized",
    "seoOgImageLocalized",
];

function isLocalizedFieldKey(
    key: keyof SiteSettingsState,
): key is LocalizedFieldKey {
    return LOCALIZED_FIELD_KEYS.includes(key as LocalizedFieldKey);
}

function cloneValueForKey<TKey extends keyof SiteSettingsState>(
    key: TKey,
    value: SiteSettingsState[TKey],
): SiteSettingsState[TKey] {
    if (key === "enabledLanguages") {
        return [...((value as AppLocale[]) ?? [])] as SiteSettingsState[TKey];
    }

    if (isLocalizedFieldKey(key)) {
        return cloneLocalizedMap(
            (value as Partial<Record<AppLocale, string>>) ?? {},
        ) as SiteSettingsState[TKey];
    }

    return value;
}

function createFullPayload(
    current: SiteSettingsState,
): Partial<SiteSettingsState> {
    const payload: Partial<SiteSettingsState> = {};
    for (const key of Object.keys(current) as Array<keyof SiteSettingsState>) {
        setPartialValue(payload, key, cloneValueForKey(key, current[key]));
    }
    return payload;
}

function addDiffForKey(
    diff: Partial<SiteSettingsState>,
    key: keyof SiteSettingsState,
    nextValue: SiteSettingsState[keyof SiteSettingsState],
    prevValue: SiteSettingsState[keyof SiteSettingsState],
) {
    if (key === "enabledLanguages") {
        const nextLanguages = (nextValue as AppLocale[]) ?? [];
        const prevLanguages = (prevValue as AppLocale[]) ?? [];
        if (!arraysShallowEqual(nextLanguages, prevLanguages)) {
            setPartialValue(diff, key, [
                ...nextLanguages,
            ] as SiteSettingsState[typeof key]);
        }
        return;
    }

    if (isLocalizedFieldKey(key)) {
        const nextMap = (nextValue as Partial<Record<AppLocale, string>>) ?? {};
        const prevMap = (prevValue as Partial<Record<AppLocale, string>>) ?? {};
        if (!localizedMapsEqual(nextMap, prevMap)) {
            setPartialValue(
                diff,
                key,
                cloneLocalizedMap(nextMap) as SiteSettingsState[typeof key],
            );
        }
        return;
    }

    if (nextValue !== prevValue) {
        setPartialValue(diff, key, nextValue as SiteSettingsState[typeof key]);
    }
}

function diffSettingsPayload(
    base: SiteSettingsState,
    current: SiteSettingsState,
): Partial<SiteSettingsState> {
    const diff: Partial<SiteSettingsState> = {};
    for (const key of Object.keys(current) as Array<keyof SiteSettingsState>) {
        addDiffForKey(diff, key, current[key], base[key]);
    }
    return diff;
}

function computeSettingsPayload(
    base: SiteSettingsState | null,
    current: SiteSettingsState,
): Partial<SiteSettingsState> {
    return base
        ? diffSettingsPayload(base, current)
        : createFullPayload(current);
}

function prepareRequestPayload(
    payload: Partial<SiteSettingsState>,
): Partial<SiteSettingsState> {
    const result: Partial<SiteSettingsState> = {};
    for (const key of Object.keys(payload) as Array<keyof SiteSettingsState>) {
        const value = payload[key];
        if (value === undefined) continue;
        setPartialValue(result, key, cloneValueForKey(key, value));
    }
    return result;
}

function createInitialSnapshot(settings: SiteSettingsState): SiteSettingsState {
    return {
        ...settings,
        enabledLanguages: cloneValueForKey(
            "enabledLanguages",
            settings.enabledLanguages,
        ),
        seoTitleLocalized: cloneValueForKey(
            "seoTitleLocalized",
            settings.seoTitleLocalized,
        ),
        seoDescriptionLocalized: cloneValueForKey(
            "seoDescriptionLocalized",
            settings.seoDescriptionLocalized,
        ),
        seoOgImageLocalized: cloneValueForKey(
            "seoOgImageLocalized",
            settings.seoOgImageLocalized,
        ),
    };
}

function mergeSettingsPatch(
    previous: SiteSettingsState,
    patch: Partial<SiteSettingsState>,
): SiteSettingsState {
    const next: SiteSettingsState = {
        ...previous,
        ...patch,
        enabledLanguages: Array.isArray(patch.enabledLanguages)
            ? cloneValueForKey("enabledLanguages", patch.enabledLanguages)
            : cloneValueForKey("enabledLanguages", previous.enabledLanguages),
        defaultLanguage:
            patch.defaultLanguage && isRuntimeLocale(patch.defaultLanguage)
                ? patch.defaultLanguage
                : previous.defaultLanguage,
        seoTitleLocalized: patch.seoTitleLocalized
            ? cloneValueForKey("seoTitleLocalized", patch.seoTitleLocalized)
            : cloneValueForKey("seoTitleLocalized", previous.seoTitleLocalized),
        seoDescriptionLocalized: patch.seoDescriptionLocalized
            ? cloneValueForKey(
                  "seoDescriptionLocalized",
                  patch.seoDescriptionLocalized,
              )
            : cloneValueForKey(
                  "seoDescriptionLocalized",
                  previous.seoDescriptionLocalized,
              ),
        seoOgImageLocalized: patch.seoOgImageLocalized
            ? cloneValueForKey("seoOgImageLocalized", patch.seoOgImageLocalized)
            : cloneValueForKey(
                  "seoOgImageLocalized",
                  previous.seoOgImageLocalized,
              ),
    };
    return next;
}

export function SiteSettingsPage() {
    const [settings, setSettings] =
        useState<SiteSettingsState>(defaultSettings);
    const initialSettingsRef = useRef<SiteSettingsState | null>(null);
    const sitemapWarningShownRef = useRef(false);
    const queryClient = useQueryClient();

    const siteSettingsQuery = useQuery({
        queryKey: adminQueryKeys.resource("site-settings"),
        queryFn: async () => {
            const response = await adminApiClient.get<{
                data?: Partial<SiteSettingsState>;
            }>("/site-settings");
            const incoming = response.data.data ?? {};
            const candidateDefault = incoming.defaultLanguage;
            const defaultLanguage = isRuntimeLocale(candidateDefault)
                ? candidateDefault
                : defaultSettings.defaultLanguage;
            const merged: SiteSettingsState = {
                ...defaultSettings,
                ...(incoming as SiteSettingsState),
                defaultLanguage,
                enabledLanguages: Array.isArray(incoming.enabledLanguages)
                    ? [...incoming.enabledLanguages]
                    : [...defaultSettings.enabledLanguages],
                seoTitleLocalized: cloneLocalizedMap(
                    (incoming as SiteSettingsState).seoTitleLocalized ?? {},
                ),
                seoDescriptionLocalized: cloneLocalizedMap(
                    (incoming as SiteSettingsState).seoDescriptionLocalized ??
                        {},
                ),
                seoOgImageLocalized: cloneLocalizedMap(
                    (incoming as SiteSettingsState).seoOgImageLocalized ?? {},
                ),
            };
            return merged;
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: Partial<SiteSettingsState>) => {
            const response = await adminApiClient.patch<{
                data?: Partial<SiteSettingsState>;
            }>("/site-settings", { json: payload });
            return response.data.data ?? null;
        },
    });

    useEffect(() => {
        if (!siteSettingsQuery.data) {
            return;
        }

        setSettings(createInitialSnapshot(siteSettingsQuery.data));
        initialSettingsRef.current = createInitialSnapshot(
            siteSettingsQuery.data,
        );

        if (
            !siteSettingsQuery.data.sitemapEnabled &&
            !sitemapWarningShownRef.current
        ) {
            toast.message(
                "建议启用 XML Sitemap，以帮助搜索引擎更好地索引你的站点。",
                {
                    icon: "⚠️",
                },
            );
            sitemapWarningShownRef.current = true;
        }
    }, [siteSettingsQuery.data]);

    useEffect(() => {
        if (!siteSettingsQuery.isError) {
            return;
        }

        console.error("Failed to fetch site settings", siteSettingsQuery.error);
        toast.error("加载站点设置失败，已使用默认配置。");

        if (!initialSettingsRef.current) {
            initialSettingsRef.current = createInitialSnapshot(defaultSettings);
        }
    }, [siteSettingsQuery.error, siteSettingsQuery.isError]);

    const applyPatch = (patch: Partial<SiteSettingsState>) => {
        setSettings((previous) => {
            const next = mergeSettingsPatch(previous, patch);
            initialSettingsRef.current = createInitialSnapshot(next);
            if (!next.sitemapEnabled && !sitemapWarningShownRef.current) {
                toast.message(
                    "建议启用 XML Sitemap，以帮助搜索引擎更好地索引你的站点。",
                    { icon: "⚠️" },
                );
                sitemapWarningShownRef.current = true;
            }
            return next;
        });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!settings.enabledLanguages.includes(settings.defaultLanguage)) {
            toast.error("默认语言必须包含在启用语言列表中");
            return;
        }

        const payload = computeSettingsPayload(
            initialSettingsRef.current,
            settings,
        );

        if (Object.keys(payload).length === 0) {
            toast.message("未检测到任何更改");
            return;
        }

        const requestPayload = prepareRequestPayload(payload);

        try {
            const result = await saveMutation.mutateAsync(requestPayload);
            const patch = (result ??
                requestPayload) as Partial<SiteSettingsState>;
            applyPatch(patch);
            toast.success("站点设置已保存");
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("site-settings"),
            });
        } catch (error) {
            console.error("Failed to save site settings", error);
            toast.error("保存设置失败，请稍后再试。");
        }
    };

    const toggleLanguage = (locale: AppLocale) => {
        setSettings((prev) => {
            const exists = prev.enabledLanguages.includes(locale);
            const nextLanguages = exists
                ? prev.enabledLanguages.filter((item) => item !== locale)
                : [...prev.enabledLanguages, locale];
            return { ...prev, enabledLanguages: nextLanguages };
        });
    };

    const handleDefaultLanguageChange = (locale: string) => {
        if (!isRuntimeLocale(locale)) {
            return;
        }
        const normalized = locale;
        setSettings((prev) => {
            const nextLanguages = prev.enabledLanguages.includes(normalized)
                ? prev.enabledLanguages
                : [...prev.enabledLanguages, normalized];
            return {
                ...prev,
                defaultLanguage: normalized,
                enabledLanguages: nextLanguages,
            };
        });
    };

    const updateLocalizedSeo = (
        locale: AppLocale,
        field:
            | "seoTitleLocalized"
            | "seoDescriptionLocalized"
            | "seoOgImageLocalized",
        value: string,
    ) => {
        setSettings((prev) => {
            const currentMap = prev[field] as Partial<
                Record<AppLocale, string>
            >;
            const nextMap = cloneLocalizedMap(currentMap);
            const trimmed = value.trim();
            if (trimmed) {
                nextMap[locale] = trimmed;
            } else {
                delete nextMap[locale];
            }
            return {
                ...prev,
                [field]: nextMap,
            } as SiteSettingsState;
        });
    };

    const saving = saveMutation.isPending;
    const isLoading = siteSettingsQuery.isLoading;
    const defaultLanguageConflict = !settings.enabledLanguages.includes(
        settings.defaultLanguage,
    );

    if (isLoading) {
        return (
            <div className="flex flex-col gap-[var(--grid-gap-section)]">
                <PageHeader
                    title="站点设置"
                    description="配置站点品牌、SEO、国际化等信息。"
                />
                <SettingsSkeleton />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="站点设置"
                description="配置站点品牌、SEO、国际化等信息。"
            />
            <form
                onSubmit={handleSubmit}
                className="space-y-8 rounded-xl border bg-card p-6 shadow-sm"
            >
                <section className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="站点名称">
                            <Input
                                value={settings.siteName}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        siteName: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="主域名">
                            <Input
                                value={settings.domain}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        domain: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="Logo URL">
                            <Input
                                value={settings.logoUrl}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        logoUrl: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="Favicon URL">
                            <Input
                                value={settings.faviconUrl}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        faviconUrl: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="font-semibold text-lg">SEO 设置</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="默认标题">
                            <Input
                                value={settings.seoTitle}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        seoTitle: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="OG 图像 URL">
                            <Input
                                value={settings.seoOgImage}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        seoOgImage: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                    <Field label="Meta 描述">
                        <Textarea
                            rows={3}
                            value={settings.seoDescription}
                            onChange={(event) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    seoDescription: event.target.value,
                                }))
                            }
                        />
                    </Field>
                    <Field label="Robots 规则">
                        <Textarea
                            rows={3}
                            value={settings.robotsRules}
                            onChange={(event) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    robotsRules: event.target.value,
                                }))
                            }
                            placeholder={`User-agent: *\nAllow: /`}
                        />
                    </Field>
                    <div className="space-y-4 rounded-lg border border-input p-4">
                        <div>
                            <h3 className="font-semibold text-base">
                                多语言 SEO
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                为不同语言提供专属标题、描述与分享图像。
                            </p>
                        </div>
                        <div className="space-y-6">
                            {settings.enabledLanguages.map((locale) => {
                                const label = LANGUAGE_LABELS[locale] ?? locale;
                                return (
                                    <div key={locale} className="space-y-3">
                                        <div className="font-semibold text-muted-foreground text-sm">
                                            {label}
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Field label="标题">
                                                <Input
                                                    value={
                                                        settings
                                                            .seoTitleLocalized[
                                                            locale
                                                        ] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        updateLocalizedSeo(
                                                            locale,
                                                            "seoTitleLocalized",
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field label="OG 图像 URL">
                                                <Input
                                                    value={
                                                        settings
                                                            .seoOgImageLocalized[
                                                            locale
                                                        ] ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        updateLocalizedSeo(
                                                            locale,
                                                            "seoOgImageLocalized",
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                        </div>
                                        <Field label="Meta 描述">
                                            <Textarea
                                                rows={3}
                                                value={
                                                    settings
                                                        .seoDescriptionLocalized[
                                                        locale
                                                    ] ?? ""
                                                }
                                                onChange={(event) =>
                                                    updateLocalizedSeo(
                                                        locale,
                                                        "seoDescriptionLocalized",
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <label
                            className="font-medium text-sm"
                            htmlFor="sitemap-enabled"
                        >
                            站点地图
                        </label>
                        <div className="flex items-center gap-2 text-sm">
                            <input
                                id="sitemap-enabled"
                                type="checkbox"
                                checked={settings.sitemapEnabled}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        sitemapEnabled: event.target.checked,
                                    }))
                                }
                            />
                            <span>启用 sitemap.xml 输出</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="font-semibold text-lg">品牌与主题</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field label="主色">
                            <Input
                                value={settings.brandPrimaryColor}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        brandPrimaryColor: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="辅助色">
                            <Input
                                value={settings.brandSecondaryColor}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        brandSecondaryColor: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="字体">
                            <Input
                                value={settings.brandFontFamily}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        brandFontFamily: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                    </div>
                    <Field label="头部代码（Analytics/像素）">
                        <Textarea
                            rows={4}
                            value={settings.headHtml}
                            onChange={(event) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    headHtml: event.target.value,
                                }))
                            }
                        />
                    </Field>
                    <Field label="页脚代码">
                        <Textarea
                            rows={4}
                            value={settings.footerHtml}
                            onChange={(event) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    footerHtml: event.target.value,
                                }))
                            }
                        />
                    </Field>
                </section>

                <section className="space-y-4">
                    <h2 className="font-semibold text-lg">国际化</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="默认语言">
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={settings.defaultLanguage}
                                onChange={(event) =>
                                    handleDefaultLanguageChange(
                                        event.target.value,
                                    )
                                }
                            >
                                {SUPPORTED_LANGUAGES.map((locale) => (
                                    <option key={locale} value={locale}>
                                        {LANGUAGE_LABELS[locale] ?? locale}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid gap-2">
                            <span className="font-medium text-sm">
                                启用语言
                            </span>
                            <div className="flex flex-wrap gap-3 rounded-md border border-input p-3">
                                {SUPPORTED_LANGUAGES.map((locale) => {
                                    const checked =
                                        settings.enabledLanguages.includes(
                                            locale,
                                        );
                                    return (
                                        <label
                                            key={locale}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() =>
                                                    toggleLanguage(locale)
                                                }
                                            />
                                            <span>
                                                {LANGUAGE_LABELS[locale] ??
                                                    locale}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {defaultLanguageConflict ? (
                                <p className="text-red-500 text-sm">
                                    默认语言必须包含在启用语言列表中。
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? "保存中..." : "保存设置"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

interface FieldProps {
    label: string;
    children: React.ReactNode;
    id?: string;
}

function Field({ label, children, id }: FieldProps) {
    const generatedId = useId();
    const childElement = React.isValidElement(children)
        ? (children as React.ReactElement<{ id?: string }>)
        : undefined;
    const existingId = childElement?.props.id;
    const controlId = id ?? existingId ?? generatedId;
    const renderedChild =
        childElement && !existingId
            ? React.cloneElement(childElement, { id: controlId })
            : children;

    return (
        <div className="grid gap-2">
            <label className="font-medium text-sm" htmlFor={controlId}>
                {label}
            </label>
            {renderedChild}
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
            {SETTINGS_SKELETON_SECTION_KEYS.map((sectionKey) => (
                <div key={sectionKey} className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid gap-4 md:grid-cols-2">
                        {SETTINGS_SKELETON_FIELD_KEYS.map((fieldKey) => (
                            <Skeleton
                                key={`${sectionKey}-${fieldKey}`}
                                className="h-10 w-full"
                            />
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
}
