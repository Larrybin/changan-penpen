import type {
    CreateParams,
    CustomParams,
    DataProvider,
    DeleteOneParams,
    GetListParams,
    GetOneParams,
    UpdateParams,
} from "@/lib/crud/types";

import { buildListSearchParams } from "@/lib/query/params";
import { adminApiClient } from "@/modules/admin/api/client";
import {
    deleteAdminRecord,
    isBodyInit,
    normalizeAdminResourcePath,
} from "@/modules/admin/api/resources";
import type {
    AdminListPayload,
    AdminSinglePayload,
} from "@/modules/admin/api/transformers";
import {
    resolveAdminListPayload,
    resolveAdminSinglePayload,
} from "@/modules/admin/api/transformers";

function normalizeIdentifier(id: DeleteOneParams["id"]) {
    if (typeof id === "string" || typeof id === "number") {
        return id;
    }
    if (typeof id === "object" && id !== null && "toString" in id) {
        return (id as { toString(): string }).toString();
    }
    throw new Error("Invalid identifier supplied to adminDataProvider");
}

export const adminDataProvider = {
    getList: async <TData = Record<string, unknown>>(params: GetListParams) => {
        const resourcePath = normalizeAdminResourcePath(params.resource);
        const searchParams = buildListSearchParams({
            pagination: params.pagination,
            filters: params.filters,
            sorters: params.sorters,
        });

        const response = await adminApiClient.get<AdminListPayload<TData>>(
            resourcePath,
            {
                searchParams,
            },
        );
        const { items, total } = resolveAdminListPayload<TData>(response.data);

        return {
            data: items,
            total,
        };
    },
    getOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: GetOneParams) => {
        const resourcePath = normalizeAdminResourcePath(resource);
        const response = await adminApiClient.get<AdminSinglePayload<TData>>(
            `${resourcePath}/${id}`,
        );
        const record = resolveAdminSinglePayload<TData>(response.data);
        return {
            data: (record ?? null) as TData,
        };
    },
    create: async <TData = Record<string, unknown>>({
        resource,
        variables,
    }: CreateParams) => {
        const resourcePath = normalizeAdminResourcePath(resource);
        const response = await adminApiClient.post<AdminSinglePayload<TData>>(
            resourcePath,
            {
                json: variables ?? {},
            },
        );
        const record = resolveAdminSinglePayload<TData>(response.data);
        return {
            data: (record ?? null) as TData,
        };
    },
    update: async <TData = Record<string, unknown>>({
        resource,
        id,
        variables,
    }: UpdateParams) => {
        const resourcePath = normalizeAdminResourcePath(resource);
        const response = await adminApiClient.patch<AdminSinglePayload<TData>>(
            `${resourcePath}/${id}`,
            {
                json: variables ?? {},
            },
        );
        const record = resolveAdminSinglePayload<TData>(response.data);
        return {
            data: (record ?? null) as TData,
        };
    },
    deleteOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: DeleteOneParams) => {
        await deleteAdminRecord({ resource, id });
        const identifier = normalizeIdentifier(id);
        return {
            data: { id: identifier } as TData,
        };
    },
    custom: async <TData = Record<string, unknown>>(params: CustomParams) => {
        const { url, method, meta, payload } = params;
        const requestUrl = normalizeAdminResourcePath(url ?? "");
        const requestOptions: Parameters<typeof adminApiClient.request>[1] = {
            method: method?.toString().toUpperCase(),
            headers: meta?.headers as HeadersInit | undefined,
        };

        if (isBodyInit(payload)) {
            requestOptions.body = payload;
        } else if (payload !== undefined) {
            requestOptions.json = payload;
        }

        const response = await adminApiClient.request<TData | { data?: TData }>(
            requestUrl,
            requestOptions,
        );

        const data = response.data;
        if (data && typeof data === "object" && "data" in data) {
            return data as { data?: TData };
        }
        return data as TData;
    },
    getApiUrl: () => "/api/v1/admin",
} satisfies Required<DataProvider>;
