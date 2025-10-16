"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CheckboxState = boolean | "indeterminate";

type ColumnLabelMeta = {
    label?: string;
};

export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pageCount: number;
    pageIndex: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    totalCount: number;
    itemNameSingular: string;
    itemNamePlural: string;
    isLoading?: boolean;
    emptyState?: React.ReactNode;
    skeletonRowCount?: number;
    pageSizeOptions?: number[];
    getRowHref?: (row: TData) => string | undefined;
    excludeClickableColumns?: string[];
    className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    pageIndex,
    pageSize,
    onPageChange,
    onPageSizeChange,
    totalCount,
    itemNameSingular,
    itemNamePlural,
    isLoading = false,
    emptyState,
    skeletonRowCount = 5,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    getRowHref,
    excludeClickableColumns = ["actions"],
    className,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        pageCount,
        manualPagination: true,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex,
                pageSize,
            },
        },
    });

    const visibleColumns = table.getVisibleLeafColumns();
    const skeletonRowIds = React.useMemo(
        () =>
            Array.from(
                { length: Math.max(1, skeletonRowCount) },
                (_, index) => `skeleton-${index}`,
            ),
        [skeletonRowCount],
    );
    const hasRows = table.getRowModel().rows.length > 0;
    const displayEmptyState = !isLoading && !hasRows;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">每页显示</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            const nextSize = Number(value);
                            onPageSizeChange(nextSize);
                            onPageChange(0);
                        }}
                    >
                        <SelectTrigger className="h-8 w-[88px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map((sizeOption) => (
                                <SelectItem
                                    key={sizeOption}
                                    value={`${sizeOption}`}
                                >
                                    {sizeOption}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                        {itemNamePlural}
                    </span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto">
                            列显示
                            <ChevronDown className="ml-2 size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-72">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                const columnMeta = column.columnDef.meta as
                                    | ColumnLabelMeta
                                    | undefined;

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(
                                            checked: CheckboxState,
                                        ) =>
                                            column.toggleVisibility(
                                                checked === true,
                                            )
                                        }
                                    >
                                        {columnMeta?.label ?? column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            skeletonRowIds.map((rowId) => (
                                <TableRow key={rowId}>
                                    {visibleColumns.map((column) => (
                                        <TableCell key={column.id}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : displayEmptyState ? (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length || 1}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    {emptyState ?? "暂无数据。"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => {
                                const href = getRowHref?.(row.original);

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected()
                                                ? "selected"
                                                : undefined
                                        }
                                        className={href ? "cursor-pointer" : ""}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const columnId = cell.column.id;
                                            const isExcluded =
                                                excludeClickableColumns.includes(
                                                    columnId,
                                                );
                                            const cellContent = flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            );

                                            if (href && !isExcluded) {
                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="p-0"
                                                    >
                                                        <Link
                                                            className="block px-4 py-3"
                                                            href={href}
                                                        >
                                                            {cellContent}
                                                        </Link>
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell key={cell.id}>
                                                    {cellContent}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                    第 {pageIndex + 1} / {Math.max(pageCount, 1)} 页 · 共{" "}
                    {totalCount}{" "}
                    {totalCount === 1 ? itemNameSingular : itemNamePlural}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(0)}
                        disabled={pageIndex <= 0}
                    >
                        <span className="sr-only">跳到第一页</span>
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(pageIndex - 1)}
                        disabled={pageIndex <= 0}
                    >
                        <span className="sr-only">上一页</span>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(pageIndex + 1)}
                        disabled={pageIndex >= pageCount - 1}
                    >
                        <span className="sr-only">下一页</span>
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(pageCount - 1)}
                        disabled={pageIndex >= pageCount - 1}
                    >
                        <span className="sr-only">跳到最后一页</span>
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
