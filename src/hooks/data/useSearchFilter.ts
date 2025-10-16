"use client";

import type { CrudFilter } from "@refinedev/core";
import { useCallback, useMemo, useState } from "react";

export interface SearchFilterConfig {
    field: string;
    operator: CrudFilter["operator"];
    value?: unknown;
    transform?: (value: unknown) => unknown;
}

export interface UseSearchFilterOptions {
    // 搜索配置
    searchFields?: string[];
    searchOperator?: CrudFilter["operator"];
    searchTransform?: (value: string) => unknown;

    // 过滤器配置
    filters?: SearchFilterConfig[];

    // 初始值
    initialSearch?: string;
    initialFilters?: Record<string, unknown>;

    // 防抖配置
    debounceMs?: number;
}

export interface UseSearchFilterResult {
    // 状态
    search: string;
    filters: CrudFilter[];
    filterValues: Record<string, unknown>;

    // 搜索操作
    setSearch: (search: string) => void;
    clearSearch: () => void;

    // 过滤器操作
    setFilter: (field: string, value: unknown) => void;
    setFilters: (filters: Record<string, unknown>) => void;
    clearFilter: (field: string) => void;
    clearAllFilters: () => void;

    // 组合操作
    reset: () => void;
    hasActiveFilters: boolean;
}

/**
 * 通用搜索和过滤器Hook
 * 统一管理搜索状态和过滤器逻辑
 */
export function useSearchFilter(
    options: UseSearchFilterOptions = {},
): UseSearchFilterResult {
    const {
        searchFields = ["search"],
        searchOperator = "contains",
        searchTransform,
        filters: filterConfigs = [],
        initialSearch = "",
        initialFilters = {},
        debounceMs = 300,
    } = options;

    // 状态管理
    const [search, setSearchState] = useState(initialSearch);
    const [filterValues, setFilterValues] =
        useState<Record<string, unknown>>(initialFilters);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    // 防抖搜索
    const setSearch = useCallback(
        (newSearch: string) => {
            setSearchState(newSearch);

            if (debounceMs > 0) {
                const timeoutId = setTimeout(() => {
                    setDebouncedSearch(newSearch);
                }, debounceMs);
                return () => clearTimeout(timeoutId);
            } else {
                setDebouncedSearch(newSearch);
            }
        },
        [debounceMs],
    );

    // 清除搜索
    const clearSearch = useCallback(() => {
        setSearch("");
    }, [setSearch]);

    // 设置单个过滤器
    const setFilter = useCallback((field: string, value: unknown) => {
        setFilterValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    // 设置多个过滤器
    const setFilters = useCallback((newFilters: Record<string, unknown>) => {
        setFilterValues(newFilters);
    }, []);

    // 清除单个过滤器
    const clearFilter = useCallback((field: string) => {
        setFilterValues((prev) => {
            const newFilters = { ...prev };
            delete newFilters[field];
            return newFilters;
        });
    }, []);

    // 清除所有过滤器
    const clearAllFilters = useCallback(() => {
        setFilterValues({});
    }, []);

    // 重置所有搜索和过滤器
    const reset = useCallback(() => {
        setSearch(initialSearch);
        setFilterValues(initialFilters);
    }, [setSearch, initialSearch, initialFilters]);

    // 构建过滤器
    const filters = useMemo(() => {
        const result: CrudFilter[] = [];

        // 搜索过滤器
        if (debouncedSearch.trim() && searchFields.length > 0) {
            const searchValue = searchTransform
                ? searchTransform(debouncedSearch)
                : debouncedSearch;

            if (searchFields.length === 1) {
                // 单字段搜索
                result.push({
                    field: searchFields[0],
                    operator: searchOperator,
                    value: searchValue,
                });
            } else {
                // 多字段搜索 - 创建OR条件
                // 注意：这需要后端支持OR条件查询
                result.push({
                    field: "search",
                    operator: searchOperator,
                    value: searchValue,
                });
            }
        }

        // 配置的过滤器
        filterConfigs.forEach((config) => {
            const value = filterValues[config.field];
            if (value !== undefined && value !== null && value !== "") {
                const transformedValue = config.transform
                    ? config.transform(value)
                    : value;

                result.push({
                    field: config.field,
                    operator: config.operator,
                    value: transformedValue,
                });
            }
        });

        return result;
    }, [
        debouncedSearch,
        searchFields,
        searchOperator,
        searchTransform,
        filterConfigs,
        filterValues,
    ]);

    // 检查是否有活跃的过滤器
    const hasActiveFilters = useMemo(() => {
        return Boolean(
            debouncedSearch.trim() ||
                Object.entries(filterValues).some(([key, value]) => {
                    const config = filterConfigs.find((c) => c.field === key);
                    const defaultValue = config?.value;
                    return (
                        value !== undefined &&
                        value !== null &&
                        value !== defaultValue
                    );
                }),
        );
    }, [debouncedSearch, filterValues, filterConfigs]);

    return {
        // 状态
        search,
        filters,
        filterValues,

        // 搜索操作
        setSearch,
        clearSearch,

        // 过滤器操作
        setFilter,
        setFilters,
        clearFilter,
        clearAllFilters,

        // 组合操作
        reset,
        hasActiveFilters,
    };
}

/**
 * 预定义的常用过滤器配置
 */
export const commonFilters = {
    // 文本搜索
    textSearch: (field: string): SearchFilterConfig => ({
        field,
        operator: "contains",
    }),

    // 精确匹配
    exactMatch: (field: string): SearchFilterConfig => ({
        field,
        operator: "eq",
    }),

    // 范围过滤
    range: (field: string): SearchFilterConfig => ({
        field,
        operator: "between",
        transform: (value: readonly [unknown, unknown]) => ({
            start: value?.[0] ?? null,
            end: value?.[1] ?? null,
        }),
    }),

    // 列表过滤
    inList: (field: string): SearchFilterConfig => ({
        field,
        operator: "in",
        transform: (value: unknown[]) => value,
    }),

    // 日期范围
    dateRange: (field: string): SearchFilterConfig => ({
        field,
        operator: "between",
        transform: (range: [Date, Date]) => [
            range[0].toISOString(),
            range[1].toISOString(),
        ],
    }),
};

/**
 * 创建特定用途的搜索过滤器Hook
 */
export function createSearchFilterHook(options: UseSearchFilterOptions) {
    return () => useSearchFilter(options);
}

// 预定义的搜索过滤器Hook
export const useTenantSearch = createSearchFilterHook({
    searchFields: ["email", "name"],
    filters: [
        {
            field: "subscriptionStatus",
            operator: "eq",
        },
        {
            field: "createdAt",
            operator: "gte",
            transform: (date: Date) => date.toISOString(),
        },
    ],
});

export const useOrderSearch = createSearchFilterHook({
    searchFields: ["customerEmail", "id"],
    filters: [
        {
            field: "status",
            operator: "eq",
        },
        {
            field: "amountCents",
            operator: "between",
        },
        {
            field: "createdAt",
            operator: "between",
        },
    ],
});

export const useCreditSearch = createSearchFilterHook({
    searchFields: ["customerEmail", "description"],
    filters: [
        {
            field: "type",
            operator: "eq",
        },
        {
            field: "amount",
            operator: "between",
        },
        {
            field: "createdAt",
            operator: "between",
        },
    ],
});
