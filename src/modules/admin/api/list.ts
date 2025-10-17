import type { CrudFilters, CrudSorting } from "@refinedev/core";

import { buildListSearchParams } from "@/lib/query/params";

import { adminApiClient } from "./client";
import type { AdminListPayload } from "./transformers";
import { resolveAdminListPayload } from "./transformers";

export interface FetchAdminListOptions {
    resource: string;
    pagination?: {
        pageIndex?: number;
        pageSize?: number;
    };
    filters?: CrudFilters;
    sorters?: CrudSorting;
    signal?: AbortSignal;
}

export interface FetchAdminListResult<TData> {
    items: TData[];
    total: number;
}

export async function fetchAdminList<TData = Record<string, unknown>>({
    resource,
    pagination,
    filters,
    sorters,
    signal,
}: FetchAdminListOptions): Promise<FetchAdminListResult<TData>> {
    const searchParams = buildListSearchParams({
        pagination:
            pagination?.pageIndex !== undefined ||
            pagination?.pageSize !== undefined
                ? {
                      current:
                          typeof pagination?.pageIndex === "number"
                              ? pagination.pageIndex + 1
                              : undefined,
                      pageSize: pagination?.pageSize,
                  }
                : undefined,
        filters,
        sorters,
    });

    const response = await adminApiClient.get<AdminListPayload<TData>>(
        resource,
        {
            searchParams,
            ...(signal ? { signal } : {}),
        },
    );

    return resolveAdminListPayload<TData>(response.data);
}
