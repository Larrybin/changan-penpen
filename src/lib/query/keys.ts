import type { CrudFilters, CrudSorting } from "@/lib/crud/types";

import { buildListSearchParams } from "@/lib/query/params";

type Serializable = string | number | boolean | null | undefined;

export interface ListKeyOptions {
    pagination?: {
        pageIndex?: number;
        pageSize?: number;
        cursor?: string | null;
    };
    filters?: CrudFilters;
    sorters?: CrudSorting;
    meta?: Record<string, Serializable>;
}

function serializeListOptions(options?: ListKeyOptions) {
    if (!options) {
        return {};
    }

    const paginationParams = options.pagination
        ? {
              page: options.pagination.pageIndex,
              pageSize: options.pagination.pageSize,
              cursor: options.pagination.cursor,
          }
        : {};

    const params = buildListSearchParams({
        pagination:
            paginationParams.page !== undefined ||
            paginationParams.pageSize !== undefined ||
            paginationParams.cursor !== undefined
                ? {
                      current:
                          typeof paginationParams.page === "number"
                              ? paginationParams.page + 1
                              : undefined,
                      pageSize: paginationParams.pageSize,
                      cursor:
                          paginationParams.cursor === undefined
                              ? undefined
                              : (paginationParams.cursor ?? undefined),
                  }
                : undefined,
        filters: options.filters,
        sorters: options.sorters,
    });

    return {
        query: params.toString(),
        meta: options.meta ?? null,
    };
}

export const adminQueryKeys = {
    all: ["admin"] as const,
    resource: (resource: string) => ["admin", resource] as const,
    list: (resource: string, options?: ListKeyOptions) =>
        ["admin", resource, "list", serializeListOptions(options)] as const,
    detail: (
        resource: string,
        id: string | number,
        meta?: Record<string, Serializable>,
    ) => ["admin", resource, "detail", String(id), meta ?? null] as const,
};
