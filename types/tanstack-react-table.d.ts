import type * as React from "react";

declare module "@tanstack/react-table" {
    export type RowData = Record<string, unknown>;

    export type SortingState = Array<{ id: string; desc?: boolean }>;
    export type VisibilityState = Record<string, boolean>;
    export type RowSelectionState = Record<string, boolean>;

    export interface ColumnDef<TData = RowData, TValue = unknown> {
        id?: string;
        header?: React.ReactNode | ((ctx: HeaderContext<TData, TValue>) => React.ReactNode);
        cell?: (ctx: CellContext<TData, TValue>) => React.ReactNode;
        accessorKey?: keyof TData | string;
        meta?: Record<string, unknown>;
        enableSorting?: boolean;
        [key: string]: unknown;
    }

    export interface Column<TData = RowData, TValue = unknown> {
        id: string;
        columnDef: ColumnDef<TData, TValue>;
        getCanHide(): boolean;
        getIsVisible(): boolean;
        toggleVisibility(value?: boolean): void;
    }

    export interface Cell<TData = RowData, TValue = unknown> {
        id: string;
        column: Column<TData, TValue>;
        getContext(): CellContext<TData, TValue>;
    }

    export interface Row<TData = RowData> {
        id: string;
        original: TData;
        getIsSelected(): boolean;
        getVisibleCells(): Cell<TData>[];
        getValue<TValue = unknown>(columnId: string): TValue;
    }

    export interface CellContext<TData = RowData, TValue = unknown> {
        row: Row<TData>;
        column: Column<TData, TValue>;
        getValue(): TValue;
    }

    export interface Header<TData = RowData, TValue = unknown> {
        id: string;
        isPlaceholder: boolean;
        column: Column<TData, TValue>;
        getContext(): HeaderContext<TData, TValue>;
    }

    export interface HeaderGroup<TData = RowData, TValue = unknown> {
        id: string;
        headers: Header<TData, TValue>[];
    }

    export interface HeaderContext<TData = RowData, TValue = unknown> {
        table: Table<TData>;
        column: Column<TData, TValue>;
    }

    export interface Table<TData = RowData> {
        getAllColumns(): Column<TData>[];
        getAllLeafColumns(): Column<TData>[];
        getVisibleLeafColumns(): Column<TData>[];
        getHeaderGroups(): HeaderGroup<TData>[];
        getRowModel(): { rows: Row<TData>[] };
        getState(): {
            sorting: SortingState;
            columnVisibility: VisibilityState;
            rowSelection?: RowSelectionState;
            pagination?: { pageIndex: number; pageSize: number };
        };
        setColumnVisibility(state: VisibilityState): void;
        setSorting(state: SortingState): void;
        resetSorting(): void;
    }

    export function flexRender(component: unknown, props: unknown): React.ReactNode;
    export function getCoreRowModel<TData = RowData>(): () => { rows: Row<TData>[] };
    export function getSortedRowModel<TData = RowData>(): () => { rows: Row<TData>[] };
    export function useReactTable<TData = RowData>(options: {
        data: TData[];
        columns: ColumnDef<TData, any>[];
        pageCount?: number;
        manualPagination?: boolean;
        state?: {
            sorting?: SortingState;
            columnVisibility?: VisibilityState;
            rowSelection?: RowSelectionState;
            pagination?: { pageIndex: number; pageSize: number };
        };
        onSortingChange?: (state: SortingState) => void;
        onColumnVisibilityChange?: (state: VisibilityState) => void;
        onRowSelectionChange?: (state: RowSelectionState) => void;
        getCoreRowModel?: () => { rows: Row<TData>[] };
        getSortedRowModel?: () => { rows: Row<TData>[] };
    }): Table<TData>;
}
