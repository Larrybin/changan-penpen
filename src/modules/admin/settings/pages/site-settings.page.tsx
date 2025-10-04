"use client";

import { useEffect, useState } from "react";
import { useNotification } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    sitemapEnabled: false,
    robotsRules: "",
    brandPrimaryColor: "#2563eb",
    brandSecondaryColor: "#0f172a",
    brandFontFamily: "Inter",
    headHtml: "",
    footerHtml: "",
    defaultLanguage: "zh-CN",
    enabledLanguages: ["zh-CN"],
};

export function SiteSettingsPage() {
    const [settings, setSettings] =
        useState<SiteSettingsState>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { open } = useNotification();

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            const response = await fetch("/api/admin/site-settings", {
                credentials: "include",
            });
            if (response.ok) {
                const payload = await response.json();
                setSettings({
                    ...defaultSettings,
                    ...(payload.data as SiteSettingsState),
                });
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await fetch("/api/admin/site-settings", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...settings,
                    enabledLanguages: settings.enabledLanguages,
                }),
            });
            if (!response.ok) {
                throw new Error("保存站点设置失败");
            }
            open?.({ message: "站点设置已保存", type: "success" });
        } catch (error) {
            open?.({
                message: error instanceof Error ? error.message : "保存失败",
                type: "error",
            });
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
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
                <div>
                    <h1 className="text-xl font-semibold">站点设置</h1>
                    <p className="text-sm text-muted-foreground">
                        配置站点基础信息、品牌样式与 SEO。
                    </p>
                </div>
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
                    <label className="text-sm font-medium">站点地图</label>
                    <div className="flex items-center gap-2 text-sm">
                        <input
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
                    保存设置
                </Button>
            </div>
        </form>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
