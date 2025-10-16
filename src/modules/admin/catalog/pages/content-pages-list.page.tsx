"use client";

import { useDelete, useList } from "@refinedev/core";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ContentPageRecord } from "@/modules/admin/types/resource.types";

const CONTENT_LIST_SKELETON_ROW_KEYS = Array.from(
    { length: 6 },
    (_, index) => `content-pages-list-row-${index}`,
);
const CONTENT_LIST_SKELETON_CELL_KEYS = Array.from(
    { length: 6 },
    (_, index) => `content-pages-list-cell-${index}`,
);

const formatDateTime = (value?: string | null) =>
    typeof value === "string" && value.length > 0 ? value.slice(0, 19) : "-";

export function ContentPagesListPage() {
    const { query, result } = useList<ContentPageRecord>({
        resource: "content-pages",
    });
    const { mutateAsync: deletePage } = useDelete();
    const isLoading = query.isLoading;
    const pages = result?.data ?? [];

    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="内容管理"
                description="维护站点展示页、帮助中心或营销内容。"
                actions={
                    <Button asChild>
                        <Link
                            href={`${adminRoutes.catalog.contentPages}/create`}
                        >
                            新建内容
                        </Link>
                    </Button>
                }
            />
            <div className="overflow-x-auto rounded-md border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/60 text-left text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3">标题</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">语言</th>
                            <th className="px-4 py-3">状态</th>
                            <th className="px-4 py-3">更新时间</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading &&
                            CONTENT_LIST_SKELETON_ROW_KEYS.map((rowKey) => (
                                <tr key={rowKey}>
                                    {CONTENT_LIST_SKELETON_CELL_KEYS.map(
                                        (cellKey) => (
                                            <td
                                                key={`${rowKey}-${cellKey}`}
                                                className="px-4 py-3"
                                            >
                                                <Skeleton className="h-5 w-full" />
                                            </td>
                                        ),
                                    )}
                                </tr>
                            ))}
                        {!isLoading && pages.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    暂无内容页。
                                </td>
                            </tr>
                        )}
                        {pages.map((page) => (
                            <tr key={page.id} className="border-t">
                                <td className="px-4 py-3 font-medium">
                                    {page.title ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {page.slug ?? "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {page.language ?? "-"}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {page.status ?? "-"}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {formatDateTime(page.updatedAt)}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link
                                            href={`${adminRoutes.catalog.contentPages}/edit/${page.id}`}
                                        >
                                            编辑
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={async () => {
                                            await deletePage({
                                                resource: "content-pages",
                                                id: page.id,
                                            });
                                        }}
                                    >
                                        删除
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
