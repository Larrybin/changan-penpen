"use client";

import { useOne } from "@refinedev/core";
import { useParams } from "next/navigation";
import { ContentPageForm } from "@/modules/admin/catalog/components/content-page-form";

export function ContentPageEditPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);
    const isValidId = Number.isFinite(id);
    const effectiveId = isValidId ? id : 0;

    const { query, result } = useOne({
        resource: "content-pages",
        id: effectiveId,
        queryOptions: {
            enabled: isValidId,
        },
    });

    if (!isValidId) {
        return <p className="text-sm text-muted-foreground">参数错误</p>;
    }

    const isLoading = query.isLoading;
    if (isLoading) {
        return <p className="text-sm text-muted-foreground">加载中...</p>;
    }

    if (!result?.data) {
        return (
            <p className="text-sm text-muted-foreground">未找到该内容页。</p>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">编辑内容页</h1>
                <p className="text-sm text-muted-foreground">
                    调整页面内容与发布状态。
                </p>
            </div>
            <ContentPageForm id={id} initialData={result.data} />
        </div>
    );
}
