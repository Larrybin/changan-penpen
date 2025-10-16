"use client";

import type { CrudFilter } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import { useDataTableConfig } from "@/utils/data-table/data-table-provider";
import type { DataTableState } from "@/utils/data-table/types";
import type {
    UsePaginatedDataOptions,
    UsePaginatedDataResult,
    UseSearchPaginatedDataResult,
} from "./usePaginatedData";
import { usePaginatedData, useSearchPaginatedData } from "./usePaginatedData";
import type { UseSearchFilterOptions } from "./useSearchFilter";
import { useSearchFilter } from "./useSearchFilter";

const hasSearchControls = <T>(
    value: UsePaginatedDataResult<T> | UseSearchPaginatedDataResult<T>,
): value is UseSearchPaginatedDataResult<T> => "search" in value;
/**
 * 数据表格Hook配置
 */
export interface UseDataTableOptions<T = Record<string, unknown>> {
    // 基础配置
    resource: string;
    columns: ColumnDef<T>[];

    // 分页配置
    initialPageSize?: number;
    pageSizeOptions?: number[];

    // 搜索配置
    enableSearch?: boolean;
    searchOptions?: UseSearchFilterOptions;

    // 数据获取配置
    dataOptions?: Omit<UsePaginatedDataOptions<T>, "resource">;

    // 显示配置
    itemNameSingular: string;
    itemNamePlural: string;
}

/**
 * 数据表格Hook结果
 */
export interface UseDataTableResult<T = Record<string, unknown>>
    extends Omit<DataTableState<T>, "search"> {
    // 列定义
    columns: ColumnDef<T>[];

    // 搜索状态
    search?: string;
    setSearch?: (search: string) => void;
    clearSearch?: () => void;

    // 过滤器状态
    filters: CrudFilter[];
    filterValues: Record<string, unknown>;
    setFilter?: (field: string, value: unknown) => void;
    setFilters?: (filters: Record<string, unknown>) => void;
    clearFilter?: (field: string) => void;
    clearAllFilters?: () => void;
    resetFilters?: () => void;
    hasActiveFilters: boolean;

    // 分页操作
    setPageIndex: (page: number) => void;
    setPageSize: (size: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
    refresh: () => void;

    // 分页状态
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;

    // 显示配置
    itemNameSingular: string;
    itemNamePlural: string;

    // 其他状态
    error: Error | null;
}

/**
 * 通用数据表格Hook
 * 整合分页、搜索、过滤等功能
 */
export function useDataTable<T = Record<string, unknown>>(
    options: UseDataTableOptions<T>,
): UseDataTableResult<T> {
    const {
        resource,
        columns,
        initialPageSize,
        enableSearch = true,
        searchOptions,
        dataOptions = {},
        itemNameSingular,
        itemNamePlural,
    } = options;

    // 获取全局配置
    const globalConfig = useDataTableConfig();

    // 合并配置
    const pageSize = initialPageSize ?? globalConfig.defaultPageSize;

    // 搜索和过滤
    const searchFilter = useSearchFilter({
        ...searchOptions,
        debounceMs: searchOptions?.debounceMs ?? 300,
    });

    const {
        filters: optionFilters = [],
        enabled: optionEnabled,
        ...restDataOptions
    } = dataOptions;
    const combinedFilters = [...optionFilters, ...searchFilter.filters];
    const effectiveEnabled = optionEnabled ?? true;

    // 分页数据获取
    const searchPaginatedData = useSearchPaginatedData<T>({
        resource,
        initialPageSize: pageSize,
        searchFields: searchOptions?.searchFields,
        ...restDataOptions,
        filters: combinedFilters,
        enabled: enableSearch ? effectiveEnabled : false,
    });

    const regularPaginatedData = usePaginatedData<T>({
        resource,
        initialPageSize: pageSize,
        ...restDataOptions,
        filters: combinedFilters,
        enabled: enableSearch ? false : effectiveEnabled,
    });

    const paginatedData = enableSearch
        ? searchPaginatedData
        : regularPaginatedData;

    const searchControls =
        enableSearch && hasSearchControls(paginatedData)
            ? {
                  search: paginatedData.search,
                  setSearch: paginatedData.setSearch,
                  clearSearch: paginatedData.clearSearch,
              }
            : undefined;

    // 合并结果
    const result: UseDataTableResult<T> = {
        // 数据状态
        data: paginatedData.data,
        isLoading: paginatedData.isLoading,
        error: paginatedData.error,

        // 分页信息
        pageIndex: paginatedData.pageIndex,
        pageSize: paginatedData.pageSize,
        pageCount: paginatedData.pageCount,
        totalCount: paginatedData.totalCount,

        // 搜索状态（如果启用）
        ...(searchControls ?? {}),

        // 分页操作
        setPageIndex: paginatedData.setPageIndex,
        setPageSize: paginatedData.setPageSize,
        goToNextPage: paginatedData.goToNextPage,
        goToPreviousPage: paginatedData.goToPreviousPage,
        goToFirstPage: paginatedData.goToFirstPage,
        goToLastPage: paginatedData.goToLastPage,
        refresh: paginatedData.refresh,

        // 分页状态
        hasNextPage: paginatedData.hasNextPage,
        hasPreviousPage: paginatedData.hasPreviousPage,
        isFirstPage: paginatedData.isFirstPage,
        isLastPage: paginatedData.isLastPage,

        // 过滤器状态
        filters: searchFilter.filters,
        filterValues: searchFilter.filterValues,
        setFilter: searchFilter.setFilter,
        setFilters: searchFilter.setFilters,
        clearFilter: searchFilter.clearFilter,
        clearAllFilters: searchFilter.clearAllFilters,
        resetFilters: searchFilter.reset,
        hasActiveFilters: searchFilter.hasActiveFilters,

        // 列定义
        columns,

        // 显示配置
        itemNameSingular,
        itemNamePlural,
    };

    return result;
}

/**
 * 简化的数据表格Hook
 * 适用于基本的列表页面
 */
export interface UseSimpleDataTableOptions<T = Record<string, unknown>> {
    resource: string;
    columns: ColumnDef<T>[];
    itemNameSingular: string;
    itemNamePlural: string;
    initialPageSize?: number;
    enableSearch?: boolean;
}

export function useSimpleDataTable<T = Record<string, unknown>>(
    options: UseSimpleDataTableOptions<T>,
): UseDataTableResult<T> {
    return useDataTable({
        ...options,
        dataOptions: {
            suspense: false,
        },
        searchOptions: {
            searchFields: ["search"],
        },
    });
}

/**
 * 带搜索过滤器Hook的数据表格Hook
 */
export interface UseFilteredDataTableOptions<T = Record<string, unknown>>
    extends UseDataTableOptions<T> {
    filters: Array<{
        field: CrudFilter["field"];
        operator: CrudFilter["operator"];
        value: CrudFilter["value"];
    }>;
}

export function useFilteredDataTable<T = Record<string, unknown>>(
    options: UseFilteredDataTableOptions<T>,
): UseDataTableResult<T> {
    const { filters, ...dataTableOptions } = options;

    return useDataTable({
        ...dataTableOptions,
        searchOptions: {
            filters: filters.map((filter) => ({
                field: String(filter.field),
                operator: filter.operator,
                value: filter.value,
            })),
        },
    });
}
