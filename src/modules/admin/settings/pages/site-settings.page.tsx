"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

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
    sitemapEnabled: boolean;
    robotsRules: string;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandFontFamily: string;
    headHtml: string;
    footerHtml: string;
    defaultLanguage: string;
    enabledLanguages: string[];
}

const defaultSettings: SiteSettingsState = {
    siteName: "",
    domain: "",
    logoUrl: "",
    faviconUrl: "",
    seoTitle: "",
    seoDescription: "",
    seoOgImage: "",
    sitemapEnabled: true,
    robotsRules: "",
    brandPrimaryColor: "#2563eb",
    brandSecondaryColor: "#0f172a",
    brandFontFamily: "Inter",
    headHtml: "",
    footerHtml: "",
    defaultLanguage: "zh-CN",
    enabledLanguages: ["zh-CN"],
};

function arraysShallowEqual<T>(left: T[], right: T[]) {
    if (left.length !== right.length) {
        return false;
    }
    return left.every((value, index) => value === right[index]);
}

function setPartialValue<TKey extends keyof SiteSettingsState>(
    target: Partial<SiteSettingsState>,
    key: TKey,
    value: SiteSettingsState[TKey],
) {
    target[key] = value;
}

export function SiteSettingsPage() {
    const [settings, setSettings] =
        useState<SiteSettingsState>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const initialSettingsRef = useRef<SiteSettingsState | null>(null);
    const sitemapWarningShownRef = useRef(false);

    const showSitemapWarning = useCallback(() => {
        if (sitemapWarningShownRef.current) {
            return;
        }
        sitemapWarningShownRef.current = true;
        toast(
            "Enable your XML sitemap: A published sitemap helps search engines discover your marketing pages.",
            {
                icon: "⚠️",
            },
        );
    }, []);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            try {
                const response = await fetch("/api/v1/admin/site-settings", {
                    credentials: "include",
                });
                if (response.ok) {
                    const payload = (await response.json()) as {
                        data?: Partial<SiteSettingsState>;
                    };
                    const incoming = payload.data ?? {};
                    const merged: SiteSettingsState = {
                        ...defaultSettings,
                        ...(incoming as SiteSettingsState),
                        enabledLanguages: Array.isArray(
                            incoming.enabledLanguages,
                        )
                            ? [...incoming.enabledLanguages]
                            : [...defaultSettings.enabledLanguages],
                    };
                    setSettings(merged);
                    if (!merged.sitemapEnabled) {
                        showSitemapWarning();
                    }
                    initialSettingsRef.current = {
                        ...merged,
                        enabledLanguages: [...merged.enabledLanguages],
                    };
                } else {
                    const fallback: SiteSettingsState = {
                        ...defaultSettings,
                        enabledLanguages: [...defaultSettings.enabledLanguages],
                    };
                    setSettings(fallback);
                    if (!fallback.sitemapEnabled) {
                        showSitemapWarning();
                    }
                    initialSettingsRef.current = {
                        ...fallback,
                        enabledLanguages: [...fallback.enabledLanguages],
                    };
                }
            } catch (error) {
                console.error("Failed to fetch site settings", error);
                const fallback: SiteSettingsState = {
                    ...defaultSettings,
                    enabledLanguages: [...defaultSettings.enabledLanguages],
                };
                setSettings(fallback);
                if (!fallback.sitemapEnabled) {
                    showSitemapWarning();
                }
                initialSettingsRef.current = {
                    ...fallback,
                    enabledLanguages: [...fallback.enabledLanguages],
                };
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [showSitemapWarning]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const base = initialSettingsRef.current;
        let payload: Partial<SiteSettingsState>;

        if (base) {
            const diff: Partial<SiteSettingsState> = {};
            for (const key of Object.keys(settings) as Array<
                keyof SiteSettingsState
            >) {
                const nextValue = settings[key];
                const prevValue = base[key];

                if (Array.isArray(nextValue) && Array.isArray(prevValue)) {
                    const nextLanguages = nextValue as string[];
                    const prevLanguages = prevValue as string[];

                    if (!arraysShallowEqual(nextLanguages, prevLanguages)) {
                        setPartialValue(diff, key, [
                            ...nextLanguages,
                        ] as SiteSettingsState[typeof key]);
                    }

                    continue;
                }

                if (nextValue !== prevValue) {
                    setPartialValue(
                        diff,
                        key,
                        nextValue as SiteSettingsState[typeof key],
                    );
                }
            }
            payload = diff;
        } else {
            payload = {
                ...settings,
                enabledLanguages: [...settings.enabledLanguages],
            };
        }

        if (Object.keys(payload).length === 0) {
            toast("未检测到任何更改");
            return;
        }

        const requestPayload: Partial<SiteSettingsState> = { ...payload };
        if (requestPayload.enabledLanguages) {
            requestPayload.enabledLanguages = [
                ...requestPayload.enabledLanguages,
            ];
        }

        setSaving(true);
        try {
            const response = await fetch("/api/v1/admin/site-settings", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
                const errorPayload = (await response
                    .json()
                    .catch(() => null)) as { message?: string } | null;
                const message = errorPayload?.message ?? "保存站点设置失败";
                throw new Error(message);
            }

            const nextSettings: SiteSettingsState = {
                ...settings,
                ...requestPayload,
                enabledLanguages: requestPayload.enabledLanguages ?? [
                    ...settings.enabledLanguages,
                ],
            };

            setSettings(nextSettings);
            initialSettingsRef.current = {
                ...nextSettings,
                enabledLanguages: [...nextSettings.enabledLanguages],
            };
            toast.success("站点设置已保存");
        } catch (error) {
            console.error("Failed to save site settings", error);
            const message =
                error instanceof Error ? error.message : "保存站点设置失败";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleLanguagesChange = (value: string) => {
        const languages = value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        setSettings((prev) => ({ ...prev, enabledLanguages: languages }));
    };

    if (loading) {
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
                    <h2 className="text-lg font-semibold">SEO 设置</h2>
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
                    <div className="grid gap-2">
                        <label
                            className="text-sm font-medium"
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
                    <h2 className="text-lg font-semibold">品牌与主题</h2>
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
                    <h2 className="text-lg font-semibold">国际化</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="默认语言">
                            <Input
                                value={settings.defaultLanguage}
                                onChange={(event) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        defaultLanguage: event.target.value,
                                    }))
                                }
                            />
                        </Field>
                        <Field label="可用语言（逗号分隔）">
                            <Input
                                value={settings.enabledLanguages.join(",")}
                                onChange={(event) =>
                                    handleLanguagesChange(event.target.value)
                                }
                            />
                        </Field>
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
            <label className="text-sm font-medium" htmlFor={controlId}>
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
