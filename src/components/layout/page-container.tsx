"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps
    extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * 控制容器是否占满纵向空间，便于复杂布局实现 sticky footer 等场景。
     */
    fullHeight?: boolean;
}

export function PageContainer({
    className,
    fullHeight = false,
    ...props
}: PageContainerProps) {
    return (
        <div
            data-slot="page-container"
            className={cn(
                "mx-auto w-full max-w-[var(--container-max-w)] px-[var(--container-px)] py-[var(--layout-page-padding-y)]",
                fullHeight && "min-h-full",
                className,
            )}
            {...props}
        />
    );
}
