"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface AdminResourceTableColumn<TItem> {
    id: string;
    header: ReactNode;
    render: (item: TItem) => ReactNode;
    headerClassName?: string;
    cellClassName?: string;
    skeleton?: ReactNode;
}

export interface AdminResourceTableProps<TItem> {
    columns: AdminResourceTableColumn<TItem>[];
    items: TItem[];
    isLoading: boolean;
    emptyState: ReactNode;
    getRowKey: (item: TItem, index: number) => React.Key;
    skeletonRowCount?: number;
    containerClassName?: string;
    rowClassName?:
        | string
        | ((item: TItem, index: number) => string | undefined);
}

export function AdminResourceTable<TItem>({
    columns,
    items,
    isLoading,
    emptyState,
    getRowKey,
    skeletonRowCount = 6,
    containerClassName,
    rowClassName,
}: AdminResourceTableProps<TItem>) {
    const skeletonRows = Array.from(
        { length: skeletonRowCount },
        (_, index) => `skeleton-row-${index}`,
    );

    return (
        <div
            className={cn(
                "overflow-x-auto rounded-md border",
                containerClassName,
            )}
        >
            <table className="min-w-full text-sm">
                <thead className="bg-muted/60 text-left font-semibold text-muted-foreground text-xs uppercase">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.id}
                                className={cn(
                                    "px-4 py-3",
                                    column.headerClassName,
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading &&
                        skeletonRows.map((rowKey) => (
                            <tr key={rowKey}>
                                {columns.map((column) => (
                                    <td
                                        key={`${column.id}-${rowKey}`}
                                        className={cn(
                                            "px-4 py-3",
                                            column.cellClassName,
                                        )}
                                    >
                                        {column.skeleton ?? (
                                            <Skeleton className="h-5 w-full" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    {!isLoading && items.length === 0 && (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-6 text-center text-muted-foreground"
                            >
                                {emptyState}
                            </td>
                        </tr>
                    )}
                    {items.map((item, index) => {
                        const resolvedRowClassName =
                            typeof rowClassName === "function"
                                ? rowClassName(item, index)
                                : rowClassName;
                        const rowKey = getRowKey(item, index);

                        return (
                            <tr
                                key={rowKey}
                                className={cn("border-t", resolvedRowClassName)}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={`${column.id}-${rowKey}`}
                                        className={cn(
                                            "px-4 py-3",
                                            column.cellClassName,
                                        )}
                                    >
                                        {column.render(item)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
