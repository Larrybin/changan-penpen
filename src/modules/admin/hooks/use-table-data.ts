import { useList } from "@refinedev/core";
import { useCallback, useEffect } from "react";
import {
    type UseTableFiltersOptions,
    type UseTableFiltersReturn,
    useTableFilters,
} from "./use-table-filters";
import {
    type UseTablePaginationOptions,
    type UseTablePaginationReturn,
    useTablePagination,
} from "./use-table-pagination";

export interface UseTableDataOptions<TData, TFilters> {
    resource: string;
    initialFilters?: TFilters;
    select?: (data: readonly TData[]) => TData[];
    filters?: UseTableFiltersOptions<TFilters>;
    pagination?: UseTablePaginationOptions;
    queryOptions?: {
        enabled?: boolean;
        staleTime?: number;
        cacheTime?: number;
    };
}

export interface UseTableDataReturn<TData, TFilters>
    extends UseTablePaginationReturn,
        UseTableFiltersReturn<TFilters> {
    data: TData[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isFetching: boolean;
    isRefetching: boolean;
    refetch: () => void;
    totalCount: number;
    hasData: boolean;
    isEmpty: boolean;
}

export function useTableData<
    TData = Record<string, unknown>,
    TFilters extends Record<string, unknown> = Record<string, unknown>,
>(
    options: UseTableDataOptions<TData, TFilters>,
): UseTableDataReturn<TData, TFilters> {
    const {
        resource,
        initialFilters,
        select,
        queryOptions,
        pagination: paginationOptions,
        filters: filterOptions,
    } = options;

    // Initialize pagination hook
    const pagination = useTablePagination(paginationOptions);

    // Initialize filters hook with initial filters
    const filters = useTableFilters<TFilters>({
        ...filterOptions,
        defaultFilters: initialFilters,
    });

    const crudFilters = filters.crudFilters;

    // Fetch data using useList
    const { query, result } = useList<TData>({
        resource,
        pagination: pagination.refinePagination,
        filters: crudFilters,
        queryOptions: {
            enabled: queryOptions?.enabled !== false,
            staleTime: queryOptions?.staleTime ?? 5 * 60 * 1000, // 5 minutes
            cacheTime: queryOptions?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
        },
    });

    // Process data
    const rawData = result?.data ?? [];
    const data = select ? select(rawData) : rawData;

    const total = result?.total ?? rawData.length;
    const pageSize = pagination.pagination.pageSize || 1;
    const pageCount = total > 0 ? Math.ceil(total / pageSize) : 0;
    const updateDerivedState = pagination.updateDerivedState;

    // Update derived pagination state
    useEffect(() => {
        updateDerivedState({
            total,
            pageCount,
        });
    }, [pageCount, total, updateDerivedState]);

    // Reset page when filters change
    const handleFiltersChange = useCallback(
        (newFilters: TFilters | ((prev: TFilters) => TFilters)) => {
            filters.setFilters(newFilters);
            pagination.setPageIndex(0); // Reset to first page when filters change
        },
        [filters.setFilters, pagination.setPageIndex],
    );

    // Computed states
    const hasData = data.length > 0;
    const isEmpty = !query.isLoading && !hasData;

    return {
        // Data states
        data,
        isLoading: query.isLoading,
        isError: query.error != null,
        error: query.error,
        isFetching: query.isFetching,
        isRefetching: query.isFetching && !query.isLoading,
        refetch: query.refetch,
        totalCount: total,
        hasData,
        isEmpty,

        // Pagination
        pagination: pagination.pagination,
        setPagination: pagination.setPagination,
        setPageIndex: pagination.setPageIndex,
        setPageSize: pagination.setPageSize,
        resetPagination: pagination.resetPagination,
        hasNextPage: pagination.hasNextPage,
        hasPreviousPage: pagination.hasPreviousPage,
        canNextPage: pagination.canNextPage,
        canPreviousPage: pagination.canPreviousPage,
        refinePagination: pagination.refinePagination,
        updateDerivedState: pagination.updateDerivedState,

        // Filters (override setFilters to reset page)
        filters: filters.filters,
        setFilters: handleFiltersChange,
        updateFilter: filters.updateFilter,
        clearFilters: filters.clearFilters,
        clearFilter: filters.clearFilter,
        hasActiveFilters: filters.hasActiveFilters,
        crudFilters: filters.crudFilters,
        resetFilters: filters.resetFilters,
    };
}
