import type { CrudFilters, CrudSorting } from "@/lib/crud/types";

import { buildListSearchParams } from "@/lib/query/params";

import { adminApiClient } from "./client";
import type { AdminListPayload, AdminSinglePayload } from "./transformers";
import {
    resolveAdminListPayload,
    resolveAdminSinglePayload,
} from "./transformers";

export interface FetchAdminRecordOptions {
    resource: string;
    id: string | number;
    signal?: AbortSignal;
}

export interface MutateAdminRecordOptions<TVariables = unknown> {
    resource: string;
    variables?: TVariables;
    signal?: AbortSignal;
}

export interface UpdateAdminRecordOptions<TVariables = unknown>
    extends MutateAdminRecordOptions<TVariables> {
    id: string | number;
}

export interface DeleteAdminRecordOptions {
    resource: string;
    id: string | number;
    signal?: AbortSignal;
}

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

export function normalizeAdminResourcePath(resource: string) {
    if (/^https?:/i.test(resource)) {
        return resource;
    }
    if (!resource) {
        return resource;
    }
    return resource.startsWith("/") ? resource : `/${resource}`;
}

export function isBodyInit(value: unknown): value is BodyInit {
    if (value === null || value === undefined) {
        return false;
    }
    if (typeof value === "string") {
        return true;
    }
    if (typeof Blob !== "undefined" && value instanceof Blob) {
        return true;
    }
    if (typeof FormData !== "undefined" && value instanceof FormData) {
        return true;
    }
    if (
        typeof URLSearchParams !== "undefined" &&
        value instanceof URLSearchParams
    ) {
        return true;
    }
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        return true;
    }
    if (
        typeof ReadableStream !== "undefined" &&
        value instanceof ReadableStream
    ) {
        return true;
    }
    return false;
}

export async function fetchAdminRecord<TData = Record<string, unknown>>({
    resource,
    id,
    signal,
}: FetchAdminRecordOptions): Promise<TData | null> {
    const resourcePath = normalizeAdminResourcePath(resource);
    const response = await adminApiClient.get<AdminSinglePayload<TData>>(
        `${resourcePath}/${id}`,
        signal ? { signal } : undefined,
    );
    return resolveAdminSinglePayload<TData>(response.data);
}

export async function fetchAdminList<TData = Record<string, unknown>>({
    resource,
    pagination,
    filters,
    sorters,
    signal,
}: FetchAdminListOptions): Promise<FetchAdminListResult<TData>> {
    const resourcePath = normalizeAdminResourcePath(resource);
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
        resourcePath,
        {
            searchParams,
            ...(signal ? { signal } : {}),
        },
    );

    return resolveAdminListPayload<TData>(response.data);
}

export async function createAdminRecord<
    TData = Record<string, unknown>,
    TVariables = unknown,
>({
    resource,
    variables,
    signal,
}: MutateAdminRecordOptions<TVariables>): Promise<TData | null> {
    const resourcePath = normalizeAdminResourcePath(resource);
    const requestOptions = isBodyInit(variables)
        ? { body: variables }
        : { json: variables ?? {} };

    const response = await adminApiClient.post<AdminSinglePayload<TData>>(
        resourcePath,
        {
            ...requestOptions,
            ...(signal ? { signal } : {}),
        },
    );

    return resolveAdminSinglePayload<TData>(response.data);
}

export async function updateAdminRecord<
    TData = Record<string, unknown>,
    TVariables = unknown,
>({
    resource,
    id,
    variables,
    signal,
}: UpdateAdminRecordOptions<TVariables>): Promise<TData | null> {
    const resourcePath = normalizeAdminResourcePath(resource);
    const requestOptions = isBodyInit(variables)
        ? { body: variables }
        : { json: variables ?? {} };

    const response = await adminApiClient.patch<AdminSinglePayload<TData>>(
        `${resourcePath}/${id}`,
        {
            ...requestOptions,
            ...(signal ? { signal } : {}),
        },
    );

    return resolveAdminSinglePayload<TData>(response.data);
}

export async function deleteAdminRecord({
    resource,
    id,
    signal,
}: DeleteAdminRecordOptions): Promise<void> {
    const resourcePath = normalizeAdminResourcePath(resource);
    await adminApiClient.delete(
        `${resourcePath}/${id}`,
        signal ? { signal } : undefined,
    );
}
