"use client";

import { useDelete, useList } from "@refinedev/core";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import adminRoutes from "@/modules/admin/routes/admin.routes";

export function ContentPagesListPage() {
    const { query, result } = useList({ resource: "content-pages" });
    const { mutateAsync: deletePage } = useDelete();
    const isLoading = query.isLoading;
    const pages = result?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">内容管理</h1>
                    <p className="text-sm text-muted-foreground">
                        维护站点展示页、帮助中心或营销内容。
                    </p>
                </div>
                <Button asChild>
                    <Link href={`${adminRoutes.catalog.contentPages}/create`}>
                        新建内容
                    </Link>
                </Button>
            </div>
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
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-6 text-center text-muted-foreground"
                                >
                                    加载中...
                                </td>
                            </tr>
                        )}
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
                                    {page.title}
                                </td>
                                <td className="px-4 py-3">{page.slug}</td>
                                <td className="px-4 py-3">{page.language}</td>
                                <td className="px-4 py-3 capitalize">
                                    {page.status}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {page.updatedAt?.slice(0, 19)}
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
                                                id: page.id as number,
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
