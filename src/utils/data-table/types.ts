/**
 * 数据表格通用类型定义
 */

import type { CrudFilter } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import type { ReactNode } from "react";

// 分页配置
export interface PaginationConfig {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    totalCount: number;
}

// 搜索过滤器配置
export interface SearchFilterConfig {
    search?: string;
    filters?: CrudFilter[];
}

// 数据表格状态
export interface DataTableState<T = Record<string, unknown>>
    extends PaginationConfig,
        SearchFilterConfig {
    data: T[];
    isLoading: boolean;
}

// 列工厂配置
export interface ColumnFactoryConfig<T = Record<string, unknown>> {
    // 基础列配置
    id?: ColumnDef<T>["id"];
    header?: ColumnDef<T>["header"];
    cell?: ColumnDef<T>["cell"];
    meta?: ColumnDef<T>["meta"];

    // 常用配置
    sortable?: boolean;
    searchable?: boolean;
    format?:
        | "text"
        | "number"
        | "currency"
        | "date"
        | "datetime"
        | "boolean"
        | "status"
        | "custom";

    // 自定义渲染
    formatter?: (value: unknown, row: T) => ReactNode;

    // 条件显示
    condition?: (row: T) => boolean;
}

// 预定义列类型
export type PredefinedColumnType =
    | "id"
    | "email"
    | "name"
    | "amount"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "actions";

// 数据表格提供者配置
export interface DataTableProviderConfig {
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    enableColumnVisibility?: boolean;
    enableSorting?: boolean;
    enableFiltering?: boolean;
    enableRowSelection?: boolean;
    autoResetPage?: boolean;
    locale?: string;
}

// 数据表格上下文
export interface DataTableContextValue {
    config: DataTableProviderConfig;
    updateConfig: (config: Partial<DataTableProviderConfig>) => void;
    resetConfig: () => void;
    setPageSizeOptions: (options: number[]) => void;
    setDefaultPageSize: (size: number) => void;
    toggleFeature: (
        feature: keyof Omit<
            DataTableProviderConfig,
            "defaultPageSize" | "pageSizeOptions" | "locale"
        >,
    ) => void;
}

// 通用数据记录
export interface BaseRecord {
    id: string | number;
    createdAt: string;
    updatedAt: string;
}

// 租户信息
export interface TenantInfo {
    id: string | number;
    email: string;
    name?: string;
}

// 带租户的记录
export interface TenantRecord extends BaseRecord {
    tenantId: string | number;
    customerEmail: string;
    userId?: string;
}

// 导出工具函数类型
export type ColumnFactory<T = Record<string, unknown>> = (
    key: keyof T | string,
    config?: ColumnFactoryConfig<T>,
) => ColumnDef<T>;

export type CreateDataTableColumns<T = Record<string, unknown>> = (
    predefined: PredefinedColumnType[],
    customColumns?: ColumnDef<T>[],
) => ColumnDef<T>[];
