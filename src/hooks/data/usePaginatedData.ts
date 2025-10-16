"use client";

import { useList } from "@refinedev/core";
import { useCallback, useMemo, useState } from "react";
import type { DataTableState } from "@/utils/data-table/types";

export interface UsePaginatedDataOptions<_TRecord = Record<string, unknown>> {
    resource: string;
    initialPageSize?: number;
    filters?: CrudFilter[];
    sorters?: Sorter[];
    enabled?: boolean;
    suspense?: boolean;
    queryKey?: unknown[];
}

export interface UsePaginatedDataResult<T = Record<string, unknown>>
    extends Omit<DataTableState<T>, "data" | "isLoading"> {
    data: T[];
    isLoading: boolean;
    error: Error | null;
    setPageIndex: (page: number) => void;
    setPageSize: (size: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
    refresh: () => void;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
}

/**
 * 通用的分页数据Hook
 * 统一管理分页状态、数据获取和分页操作
 */
export function usePaginatedData<T = Record<string, unknown>>(
    options: UsePaginatedDataOptions<T>,
): UsePaginatedDataResult<T> {
    const {
        resource,
        initialPageSize = 20,
        filters = [],
        sorters = [],
        enabled = true,
        suspense = false,
        queryKey = [],
    } = options;

    // 分页状态
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // 数据获取
    const { query, result } = useList<T>({
        resource,
        pagination: {
            current: pageIndex + 1,
            pageSize: pageSize,
        },
        filters,
        sorters,
        queryOptions: {
            enabled,
            suspense,
            queryKey: [
                resource,
                pageIndex,
                pageSize,
                filters,
                sorters,
                ...queryKey,
            ],
        },
    });

    const isLoading = query.isLoading;
    const error = query.error as Error | null;
    const data = result?.data ?? [];
    const total = result?.total ?? 0;
    const pageCount = Math.ceil(total / pageSize);

    // 分页操作函数
    const goToNextPage = useCallback(() => {
        if (pageIndex < pageCount - 1) {
            setPageIndex((prev) => prev + 1);
        }
    }, [pageIndex, pageCount]);

    const goToPreviousPage = useCallback(() => {
        if (pageIndex > 0) {
            setPageIndex((prev) => prev - 1);
        }
    }, [pageIndex]);

    const goToFirstPage = useCallback(() => {
        setPageIndex(0);
    }, []);

    const goToLastPage = useCallback(() => {
        if (pageCount > 0) {
            setPageIndex(pageCount - 1);
        }
    }, [pageCount]);

    // 页面大小变更时重置到第一页
    const handleSetPageSize = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPageIndex(0);
    }, []);

    // 刷新数据
    const refresh = useCallback(() => {
        query.refetch();
    }, [query]);

    // 计算分页状态
    const hasNextPage = pageIndex < pageCount - 1;
    const hasPreviousPage = pageIndex > 0;
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === pageCount - 1 || pageCount === 0;

    return {
        // 数据
        data,
        isLoading,
        error,

        // 分页信息
        pageIndex,
        pageSize,
        pageCount,
        totalCount: total,

        // 分页操作
        setPageIndex,
        setPageSize: handleSetPageSize,
        goToNextPage,
        goToPreviousPage,
        goToFirstPage,
        goToLastPage,
        refresh,

        // 分页状态
        hasNextPage,
        hasPreviousPage,
        isFirstPage,
        isLastPage,
    };
}

/**
 * 使用分页数据的简化版本
 * 适用于简单的分页场景
 */
export function useSimplePaginatedData<T = Record<string, unknown>>(
    resource: string,
    initialPageSize = 20,
): UsePaginatedDataResult<T> {
    return usePaginatedData<T>({
        resource,
        initialPageSize,
    });
}

/**
 * 带搜索的分页数据Hook
 * 扩展了基础的分页功能，支持搜索
 */
export interface UseSearchPaginatedDataOptions<T = Record<string, unknown>>
    extends UsePaginatedDataOptions<T> {
    searchFields?: string[];
    initialSearch?: string;
}

export interface UseSearchPaginatedDataResult<T = Record<string, unknown>>
    extends UsePaginatedDataResult<T> {
    search: string;
    setSearch: (search: string) => void;
    clearSearch: () => void;
}

export function useSearchPaginatedData<T = Record<string, unknown>>(
    options: UseSearchPaginatedDataOptions<T>,
): UseSearchPaginatedDataResult<T> {
    const {
        searchFields = [],
        initialSearch = "",
        ...paginatedOptions
    } = options;

    const [search, setSearch] = useState(initialSearch);

    // 构建搜索过滤器
    const filters = useMemo(() => {
        if (!search.trim() || searchFields.length === 0) {
            return paginatedOptions.filters ?? [];
        }

        return [
            ...(paginatedOptions.filters ?? []),
            {
                field: "search",
                operator: "contains",
                value: search.trim(),
            },
        ];
    }, [search, searchFields, paginatedOptions.filters]);

    const clearSearch = useCallback(() => {
        setSearch("");
    }, []);

    return {
        ...usePaginatedData<T>({
            ...paginatedOptions,
            filters,
        }),
        search,
        setSearch,
        clearSearch,
    };
}
