"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { adminQueryKeys } from "@/lib/query/keys";
import { toast } from "@/lib/toast";
import {
    deleteAdminRecord,
    fetchAdminList,
} from "@/modules/admin/api/resources";
import {
    AdminResourceTable,
    type AdminResourceTableColumn,
} from "@/modules/admin/components/admin-resource-table";
import adminRoutes from "@/modules/admin/routes/admin.routes";
import type { ContentPageRecord } from "@/modules/admin/types/resource.types";

const formatDateTime = (value?: string | null) =>
    typeof value === "string" && value.length > 0 ? value.slice(0, 19) : "-";

export function ContentPagesListPage() {
    const queryClient = useQueryClient();
    const listQuery = useQuery({
        queryKey: adminQueryKeys.list("content-pages"),
        queryFn: () =>
            fetchAdminList<ContentPageRecord>({ resource: "content-pages" }),
    });
    const deleteMutation = useMutation({
        mutationFn: (pageId: number | string) =>
            deleteAdminRecord({ resource: "content-pages", id: pageId }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: adminQueryKeys.resource("content-pages"),
            });
            toast.success("内容已删除");
        },
    });
    const isLoading = listQuery.isLoading;
    const pages = listQuery.data?.items ?? [];
    const columns: AdminResourceTableColumn<ContentPageRecord>[] = [
        {
            id: "title",
            header: "标题",
            cellClassName: "font-medium",
            render: (page) => page.title ?? "-",
        },
        {
            id: "slug",
            header: "Slug",
            render: (page) => page.slug ?? "-",
        },
        {
            id: "language",
            header: "语言",
            render: (page) => page.language ?? "-",
        },
        {
            id: "status",
            header: "状态",
            cellClassName: "capitalize",
            render: (page) => page.status ?? "-",
        },
        {
            id: "updatedAt",
            header: "更新时间",
            cellClassName: "text-xs text-muted-foreground",
            render: (page) => formatDateTime(page.updatedAt),
        },
        {
            id: "actions",
            header: "",
            headerClassName: "w-0",
            cellClassName: "text-right space-x-2",
            render: (page) => (
                <>
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
                        disabled={deleteMutation.isPending}
                        onClick={async () => {
                            await deleteMutation.mutateAsync(page.id);
                        }}
                    >
                        删除
                    </Button>
                </>
            ),
        },
    ];

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
            <AdminResourceTable
                columns={columns}
                items={pages}
                isLoading={isLoading}
                emptyState="暂无内容页。"
                getRowKey={(page) => page.id}
            />
        </div>
    );
}
