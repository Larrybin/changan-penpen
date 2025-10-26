"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { adminApiClient } from "@/modules/admin/api/client";
import type {
    MarketingContentDraft,
    MarketingContentMetadata,
} from "@/modules/admin/services/marketing-content.service";

interface PreviewInfo {
    token: string;
    url: string;
    expiresAt: string;
}

function formatIso(value: string | null | undefined) {
    if (!value) {
        return "--";
    }
    try {
        return new Date(value).toLocaleString();
    } catch (_error) {
        return value;
    }
}

function buildPreviewUrl(
    origin: string,
    locale: string,
    defaultLocale: string,
    token: string,
    section: string,
) {
    const url = new URL(origin);
    url.pathname = locale === defaultLocale ? "/" : `/${locale}`;
    url.searchParams.set("previewToken", token);
    url.searchParams.set("section", section);
    return url.toString();
}

const METADATA_QUERY_KEY = ["admin", "marketing-content", "metadata"] as const;

function MarketingContentSkeleton() {
    return (
        <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-80 w-full" />
        </Card>
    );
}

function useMarketingDraftManager(
    metadata: MarketingContentMetadata,
    locale: string,
    section: string,
) {
    const queryClient = useQueryClient();
    const [editorValue, setEditorValue] = useState<string>("{}");
    const [isDirty, setIsDirty] = useState(false);
    const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);

    const detailQueryKey = useMemo(
        () =>
            ["admin", "marketing-content", "detail", locale, section] as const,
        [locale, section],
    );

    const detailQuery = useQuery({
        queryKey: detailQueryKey,
        enabled: Boolean(locale && section),
        queryFn: async () => {
            const response = await adminApiClient.get<MarketingContentDraft>(
                `/marketing-content/${locale}/${section}`,
            );
            return response.data;
        },
    });

    useEffect(() => {
        if (!detailQuery.data) {
            return;
        }
        setEditorValue(JSON.stringify(detailQuery.data.payload, null, 2));
        setIsDirty(false);
        setPreviewInfo(null);
    }, [detailQuery.data]);

    const handleEditorChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setEditorValue(event.target.value);
            setIsDirty(true);
        },
        [],
    );

    const ensureSelection = useCallback(() => {
        if (!locale || !section) {
            toast.error("请选择要编辑的语言与 Section");
            return null;
        }
        return { locale, section } as const;
    }, [locale, section]);

    const saveMutation = useMutation({
        mutationFn: async (payload: unknown) => {
            const selection = ensureSelection();
            if (!selection) {
                throw new Error("缺少 locale 或 section");
            }
            const response = await adminApiClient.put<MarketingContentDraft>(
                `/marketing-content/${selection.locale}/${selection.section}`,
                { json: { payload } },
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(detailQueryKey, data);
            toast.success("草稿已保存");
            setIsDirty(false);
        },
        onError: (error) => {
            const message =
                error instanceof Error ? error.message : "保存失败，请重试";
            toast.error(message);
        },
    });

    const previewMutation = useMutation({
        mutationFn: async () => {
            const selection = ensureSelection();
            if (!selection) {
                throw new Error("缺少 locale 或 section");
            }
            const response = await adminApiClient.post<{
                token: string;
                expiresAt: string;
            }>(
                `/marketing-content/${selection.locale}/${selection.section}/preview`,
            );
            return response.data;
        },
        onSuccess: (data) => {
            const origin =
                typeof window !== "undefined" ? window.location.origin : "";
            const url = origin
                ? buildPreviewUrl(
                      origin,
                      locale,
                      metadata.defaultLocale,
                      data.token,
                      section,
                  )
                : `/?previewToken=${data.token}`;
            setPreviewInfo({
                token: data.token,
                expiresAt: data.expiresAt,
                url,
            });
            queryClient.setQueryData(detailQueryKey, (current) =>
                current
                    ? {
                          ...current,
                          previewToken: data.token,
                          previewTokenExpiresAt: data.expiresAt,
                      }
                    : current,
            );
            toast.success("预览链接已生成");
        },
        onError: (error) => {
            const message =
                error instanceof Error ? error.message : "预览生成失败";
            toast.error(message);
        },
    });

    const publishMutation = useMutation({
        mutationFn: async () => {
            const selection = ensureSelection();
            if (!selection) {
                throw new Error("缺少 locale 或 section");
            }
            const response = await adminApiClient.post<{
                version: number;
                metadataVersion: string;
                publishedAt: string;
            }>(
                `/marketing-content/${selection.locale}/${selection.section}/publish`,
            );
            return response.data;
        },
        onSuccess: (data) => {
            toast.success(`已发布版本 v${data.version}`);
            queryClient.invalidateQueries({ queryKey: detailQueryKey });
            setPreviewInfo(null);
            setIsDirty(false);
        },
        onError: (error) => {
            const message =
                error instanceof Error ? error.message : "发布失败，请稍后再试";
            toast.error(message);
        },
    });

    const handleSave = useCallback(() => {
        if (!ensureSelection()) {
            return;
        }
        try {
            const parsed = JSON.parse(editorValue) as unknown;
            saveMutation.mutate(parsed);
        } catch (_error) {
            toast.error("JSON 无法解析，请检查格式");
        }
    }, [editorValue, ensureSelection, saveMutation]);

    const handlePreview = useCallback(() => {
        if (!ensureSelection()) {
            return;
        }
        if (isDirty) {
            toast.error("请先保存草稿，再生成预览");
            return;
        }
        previewMutation.mutate();
    }, [ensureSelection, isDirty, previewMutation]);

    const handlePublish = useCallback(() => {
        if (!ensureSelection()) {
            return;
        }
        if (isDirty) {
            toast.error("请先保存草稿，再发布");
            return;
        }
        publishMutation.mutate();
    }, [ensureSelection, isDirty, publishMutation]);

    const isLoading = detailQuery.isLoading || !detailQuery.data;

    return {
        draft: detailQuery.data,
        editorValue,
        isDirty,
        previewInfo,
        isLoading,
        handleEditorChange,
        handleSave,
        handlePreview,
        handlePublish,
        saveMutation,
        previewMutation,
        publishMutation,
    } as const;
}

interface MarketingContentEditorProps {
    metadata: MarketingContentMetadata;
    locale: string;
    section: string;
    onLocaleChange: (value: string) => void;
    onSectionChange: (value: string) => void;
}

function MarketingContentEditor({
    metadata,
    locale,
    section,
    onLocaleChange,
    onSectionChange,
}: MarketingContentEditorProps) {
    const {
        draft,
        editorValue,
        isDirty,
        previewInfo,
        isLoading,
        handleEditorChange,
        handleSave,
        handlePreview,
        handlePublish,
        saveMutation,
        previewMutation,
        publishMutation,
    } = useMarketingDraftManager(metadata, locale, section);

    return (
        <Card className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="marketing-locale-select">语言</Label>
                    <Select value={locale} onValueChange={onLocaleChange}>
                        <SelectTrigger id="marketing-locale-select">
                            <SelectValue placeholder="选择语言" />
                        </SelectTrigger>
                        <SelectContent>
                            {metadata.locales.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="marketing-section-select">Section</Label>
                    <Select value={section} onValueChange={onSectionChange}>
                        <SelectTrigger id="marketing-section-select">
                            <SelectValue placeholder="选择 Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {metadata.sections.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2 text-muted-foreground text-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span>
                        状态：
                        <Badge
                            variant={
                                draft?.status === "published"
                                    ? "secondary"
                                    : "outline"
                            }
                        >
                            {draft?.status ?? "--"}
                        </Badge>
                    </span>
                    <span>版本：v{draft?.version ?? "--"}</span>
                    <span>
                        最近发布：
                        {draft?.lastPublishedVersion
                            ? `v${draft.lastPublishedVersion}`
                            : "--"}
                    </span>
                    <span>更新于：{formatIso(draft?.updatedAt)}</span>
                    <span>更新人：{draft?.updatedBy ?? "--"}</span>
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <Skeleton className="h-80 w-full" />
                ) : (
                    <Textarea
                        value={editorValue}
                        onChange={handleEditorChange}
                        className="h-80 font-mono text-sm"
                        spellCheck={false}
                    />
                )}
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={saveMutation.isPending || isLoading}
                    >
                        {saveMutation.isPending ? "保存中..." : "保存草稿"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={
                            isLoading ||
                            previewMutation.isPending ||
                            saveMutation.isPending
                        }
                    >
                        {previewMutation.isPending
                            ? "生成中..."
                            : "生成预览链接"}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handlePublish}
                        disabled={
                            publishMutation.isPending ||
                            isLoading ||
                            saveMutation.isPending ||
                            isDirty
                        }
                    >
                        {publishMutation.isPending ? "发布中..." : "发布上线"}
                    </Button>
                </div>
            </div>

            {previewInfo ? (
                <Alert>
                    <AlertTitle>预览链接已生成</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>
                            链接将在 {formatIso(previewInfo.expiresAt)} 失效。
                        </p>
                        <p className="break-words">
                            <a
                                href={previewInfo.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                            >
                                {previewInfo.url}
                            </a>
                        </p>
                    </AlertDescription>
                </Alert>
            ) : null}

            {draft?.previewToken ? (
                <div className="text-muted-foreground text-xs">
                    当前预览 Token：{draft.previewToken}
                </div>
            ) : null}
        </Card>
    );
}

interface MarketingContentManagerProps {
    metadata?: MarketingContentMetadata;
    isLoading: boolean;
}

function MarketingContentManager({
    metadata,
    isLoading,
}: MarketingContentManagerProps) {
    const [locale, setLocale] = useState<string>("");
    const [section, setSection] = useState<string>("");

    useEffect(() => {
        if (!metadata) {
            return;
        }
        setLocale((current) => current || metadata.defaultLocale);
        setSection((current) => current || metadata.sections[0]);
    }, [metadata]);

    if (isLoading && !metadata) {
        return <MarketingContentSkeleton />;
    }

    if (!metadata || !locale || !section) {
        return <MarketingContentSkeleton />;
    }

    return (
        <MarketingContentEditor
            metadata={metadata}
            locale={locale}
            section={section}
            onLocaleChange={setLocale}
            onSectionChange={setSection}
        />
    );
}

export function MarketingContentPage() {
    const metadataQuery = useQuery({
        queryKey: METADATA_QUERY_KEY,
        queryFn: async () => {
            const response =
                await adminApiClient.get<MarketingContentMetadata>(
                    "/marketing-content",
                );
            return response.data;
        },
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="营销内容"
                description="在这里管理营销 JSON 草稿、预览与发布版本。"
            />
            <MarketingContentManager
                metadata={metadataQuery.data}
                isLoading={metadataQuery.isLoading}
            />
        </div>
    );
}

export default MarketingContentPage;
