"use client";

import Link from "next/link";
import * as React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface PageHeaderBreadcrumb {
    label: string;
    href?: string;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    breadcrumbs?: PageHeaderBreadcrumb[];
    actions?: React.ReactNode;
}

export function PageHeader({
    className,
    title,
    description,
    breadcrumbs,
    actions,
    children,
    ...props
}: PageHeaderProps) {
    const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;
    const lastCrumb = hasBreadcrumbs
        ? breadcrumbs[breadcrumbs.length - 1]
        : null;

    return (
        <div
            className={cn(
                "flex flex-col gap-4 border-border border-b pb-6",
                className,
            )}
            {...props}
        >
            {hasBreadcrumbs ? (
                <Breadcrumb className="text-muted-foreground text-xs">
                    <BreadcrumbList>
                        {breadcrumbs?.map((crumb, index) => (
                            <React.Fragment key={`${crumb.label}-${index}`}>
                                <BreadcrumbItem>
                                    {index === breadcrumbs?.length - 1 ||
                                    !crumb.href ? (
                                        <BreadcrumbPage>
                                            {crumb.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={crumb.href}>
                                                {crumb.label}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {index < breadcrumbs?.length - 1 && (
                                    <BreadcrumbSeparator />
                                )}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            ) : null}

            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
                <div className="flex flex-col gap-2">
                    {title ? (
                        <h1 className="font-semibold text-2xl text-foreground leading-tight">
                            {title}
                        </h1>
                    ) : lastCrumb ? (
                        <h1 className="font-semibold text-2xl text-foreground leading-tight">
                            {lastCrumb.label}
                        </h1>
                    ) : null}
                    {description ? (
                        <p className="max-w-2xl text-muted-foreground text-sm">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {actions}
                    </div>
                ) : null}
            </div>
            {children ? (
                <>
                    <Separator />
                    <div className="flex flex-col gap-4">{children}</div>
                </>
            ) : null}
        </div>
    );
}
