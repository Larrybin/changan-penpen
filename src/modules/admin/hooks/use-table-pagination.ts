import { useCallback, useState } from "react";
import type { Pagination } from "@refinedev/core";

export interface TablePaginationState {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
}

export interface UseTablePaginationOptions {
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    autoResetPage?: boolean;
}

export interface UseTablePaginationReturn {
    pagination: TablePaginationState;
    setPagination: (
        updates: Partial<Pick<TablePaginationState, "pageIndex" | "pageSize">>,
    ) => void;
    setPageIndex: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    resetPagination: () => void;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    canNextPage: boolean;
    canPreviousPage: boolean;
    refinePagination: Pagination;
    updateDerivedState: (
        updates: Partial<Pick<TablePaginationState, "pageCount" | "total">>,
    ) => void;
}

export function useTablePagination(
    options: UseTablePaginationOptions = {},
): UseTablePaginationReturn {
    const { defaultPageSize = 20, autoResetPage = true } = options;

    const [state, setState] = useState<
        Pick<TablePaginationState, "pageIndex" | "pageSize">
    >({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });

    const [derivedState, setDerivedState] = useState<
        Pick<TablePaginationState, "pageCount" | "total">
    >({
        pageCount: 0,
        total: 0,
    });

    const setPagination = useCallback(
        (
            updates: Partial<
                Pick<TablePaginationState, "pageIndex" | "pageSize">
            >,
        ) => {
            setState((prev) => {
                const newState = { ...prev, ...updates };

                // 如果更新了pageSize且启用了autoResetPage，则重置pageIndex
                if (
                    updates.pageSize !== undefined &&
                    updates.pageSize !== prev.pageSize &&
                    autoResetPage
                ) {
                    newState.pageIndex = 0;
                }

                return newState;
            });
        },
        [autoResetPage],
    );

    const setPageIndex = useCallback(
        (pageIndex: number) => {
            setPagination({ pageIndex });
        },
        [setPagination],
    );

    const setPageSize = useCallback(
        (pageSize: number) => {
            setPagination({ pageSize });
        },
        [setPagination],
    );

    const resetPagination = useCallback(() => {
        setState({
            pageIndex: 0,
            pageSize: defaultPageSize,
        });
    }, [defaultPageSize]);

    const updateDerivedState = useCallback(
        (
            updates: Partial<Pick<TablePaginationState, "pageCount" | "total">>,
        ) => {
            setDerivedState((prev) => ({ ...prev, ...updates }));
        },
        [],
    );

    const pagination: TablePaginationState = {
        ...state,
        ...derivedState,
    };

    const hasNextPage = pagination.pageIndex < pagination.pageCount - 1;
    const hasPreviousPage = pagination.pageIndex > 0;
    const canNextPage = hasNextPage;
    const canPreviousPage = hasPreviousPage;

    const refinePagination: Pagination = {
        current: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    };

    return {
        pagination,
        setPagination,
        setPageIndex,
        setPageSize,
        resetPagination,
        updateDerivedState,
        hasNextPage,
        hasPreviousPage,
        canNextPage,
        canPreviousPage,
        refinePagination,
    };
}

