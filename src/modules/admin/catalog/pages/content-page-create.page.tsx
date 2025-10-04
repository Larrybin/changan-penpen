"use client";

import { ContentPageForm } from "@/modules/admin/catalog/components/content-page-form";

export function ContentPageCreatePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">新建内容页</h1>
                <p className="text-sm text-muted-foreground">
                    编写页面内容与 SEO 信息。
                </p>
            </div>
            <ContentPageForm />
        </div>
    );
}
