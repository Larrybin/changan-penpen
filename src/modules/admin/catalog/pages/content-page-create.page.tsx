"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ContentPageForm } from "@/modules/admin/catalog/components/content-page-form";

export function ContentPageCreatePage() {
    return (
        <div className="flex flex-col gap-[var(--grid-gap-section)]">
            <PageHeader
                title="新建内容页"
                description="编写页面内容与 SEO 信息。"
            />
            <ContentPageForm />
        </div>
    );
}
