import type {
    CreateParams,
    DataProvider,
    DeleteOneParams,
    GetListParams,
    GetOneParams,
    UpdateParams,
} from "@refinedev/core";

import { createApiClient } from "@/lib/api-client";
import { buildListSearchParams } from "@/lib/query/params";

const adminApiClient = createApiClient({
    baseUrl: "/api/v1/admin",
    credentials: "include",
});

type ListPayload<TData> =
    | {
          data?: TData[];
          total?: number;
      }
    | TData[]
    | null
    | undefined;

type SinglePayload<TData> =
    | {
          data?: TData | null;
      }
    | TData
    | null
    | undefined;

function normalizeResourcePath(resource: string) {
    if (/^https?:/i.test(resource)) {
        return resource;
    }
    if (!resource) {
        return resource;
    }
    return resource.startsWith("/") ? resource : `/${resource}`;
}

function resolveListPayload<TData>(payload: ListPayload<TData>) {
    if (Array.isArray(payload)) {
        return { items: payload, total: payload.length };
    }

    if (payload && typeof payload === "object") {
        const items = Array.isArray(payload.data)
            ? (payload.data as TData[])
            : ([] as TData[]);
        const total =
            typeof payload.total === "number" ? payload.total : items.length;
        return { items, total };
    }

    return { items: [] as TData[], total: 0 };
}

function resolveSinglePayload<TData>(payload: SinglePayload<TData>) {
    if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data?: TData | null }).data ?? null;
    }
    return (payload as TData | null | undefined) ?? null;
}

function normalizeIdentifier(id: DeleteOneParams["id"]) {
    if (typeof id === "string" || typeof id === "number") {
        return id;
    }
    if (typeof id === "object" && id !== null && "toString" in id) {
        return (id as { toString(): string }).toString();
    }
    throw new Error("Invalid identifier supplied to adminDataProvider");
}

function isBodyInit(value: unknown): value is BodyInit {
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

export const adminDataProvider = {
    getList: async <TData = Record<string, unknown>>(params: GetListParams) => {
        const resourcePath = normalizeResourcePath(params.resource);
        const searchParams = buildListSearchParams({
            pagination: params.pagination,
            filters: params.filters,
            sorters: params.sorters,
        });

        const response = await adminApiClient.get<ListPayload<TData>>(
            resourcePath,
            {
                searchParams,
            },
        );
        const { items, total } = resolveListPayload<TData>(response.data);

        return {
            data: items,
            total,
        };
    },
    getOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: GetOneParams) => {
        const resourcePath = normalizeResourcePath(resource);
        const response = await adminApiClient.get<SinglePayload<TData>>(
            `${resourcePath}/${id}`,
        );
        return {
            data: resolveSinglePayload<TData>(response.data) ?? null,
        };
    },
    create: async <TData = Record<string, unknown>>({
        resource,
        variables,
    }: CreateParams) => {
        const resourcePath = normalizeResourcePath(resource);
        const response = await adminApiClient.post<SinglePayload<TData>>(
            resourcePath,
            {
                json: variables ?? {},
            },
        );
        return {
            data: resolveSinglePayload<TData>(response.data),
        };
    },
    update: async <TData = Record<string, unknown>>({
        resource,
        id,
        variables,
    }: UpdateParams) => {
        const resourcePath = normalizeResourcePath(resource);
        const response = await adminApiClient.patch<SinglePayload<TData>>(
            `${resourcePath}/${id}`,
            {
                json: variables ?? {},
            },
        );
        return {
            data: resolveSinglePayload<TData>(response.data),
        };
    },
    deleteOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: DeleteOneParams) => {
        const resourcePath = normalizeResourcePath(resource);
        await adminApiClient.delete(`${resourcePath}/${id}`);
        const identifier = normalizeIdentifier(id);
        return {
            data: { id: identifier } as TData,
        };
    },
    custom: async <TData = Record<string, unknown>>({
        url,
        method,
        meta,
        payload,
    }) => {
        const requestUrl = normalizeResourcePath(url ?? "");
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
