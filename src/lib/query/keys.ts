import type { CrudFilters, CrudSorting } from "@/lib/crud/types";

import { buildListSearchParams } from "@/lib/query/params";

type Serializable = string | number | boolean | null | undefined;

export interface ListKeyOptions {
    pagination?: {
        pageIndex?: number;
        pageSize?: number;
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
          }
        : {};

    const params = buildListSearchParams({
        pagination:
            paginationParams.page || paginationParams.pageSize
                ? {
                      current:
                          typeof paginationParams.page === "number"
                              ? paginationParams.page + 1
                              : undefined,
                      pageSize: paginationParams.pageSize,
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
