import type {
    CreateParams,
    DataProvider,
    DeleteOneParams,
    GetListParams,
    GetOneParams,
    UpdateParams,
} from "@refinedev/core";

const API_BASE = "/api/admin";

async function parseResponse(
    response: Response,
): Promise<Record<string, unknown>> {
    const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
    >;

    if (!response.ok) {
        const message =
            (data && typeof data.message === "string" && data.message) ||
            "Unexpected error";
        throw new Error(message);
    }

    return data;
}

function buildQuery(params?: GetListParams) {
    if (!params) return "";

    const searchParams = new URLSearchParams();

    if (params.pagination) {
        const p = params.pagination as any;
        const current = p?.current ?? p?.page;
        const pageSize = p?.pageSize;
        if (current) {
            searchParams.set("page", `${current}`);
        }
        if (pageSize) {
            searchParams.set("perPage", `${pageSize}`);
        }
    }

    if (params.filters) {
        params.filters.forEach((filter: any) => {
            if (filter && typeof filter === "object") {
                if (typeof filter.field !== "undefined") {
                    if (filter.value !== undefined && filter.value !== null) {
                        searchParams.append(String(filter.field), String(filter.value));
                    }
                } else if (
                    (filter.operator === "or" || filter.operator === "and") &&
                    Array.isArray(filter.value)
                ) {
                    filter.value.forEach((inner: any) => {
                        if (inner && typeof inner.field !== "undefined") {
                            if (inner.value !== undefined && inner.value !== null) {
                                searchParams.append(String(inner.field), String(inner.value));
                            }
                        }
                    });
                }
            }
        });
    }

    if (params.sorters && params.sorters.length > 0) {
        const sorter = params.sorters[0];
        if (sorter.field && sorter.order) {
            searchParams.set("sortBy", String(sorter.field));
            searchParams.set("sortOrder", sorter.order);
        }
    }

    return searchParams.toString() ? `?${searchParams.toString()}` : "";
}

export const adminDataProvider = {
    getList: async <TData = any>(params: GetListParams) => {
        const query = buildQuery(params);
        const response = await fetch(`${API_BASE}/${params.resource}${query}`, {
            method: "GET",
            credentials: "include",
        });
        const payload = await parseResponse(response);
        const rawData = payload.data;
        const items = Array.isArray(rawData)
            ? (rawData as TData[])
            : ([] as TData[]);
        const total =
            typeof payload.total === "number"
                ? payload.total
                : Array.isArray(rawData)
                  ? rawData.length
                  : items.length;
        return {
            data: items,
            total,
        };
    },
    getOne: async <TData = any>({ resource, id }: GetOneParams) => {
        const response = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: "GET",
            credentials: "include",
        });
        const payload = await parseResponse(response);
        return {
            data: (payload.data ?? null) as TData,
        };
    },
    create: async <TData = any>({ resource, variables }: CreateParams) => {
        const response = await fetch(`${API_BASE}/${resource}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(variables ?? {}),
        });
        const payload = await parseResponse(response);
        return {
            data: (payload.data ?? null) as TData,
        };
    },
    update: async <TData = any>({ resource, id, variables }: UpdateParams) => {
        const response = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(variables ?? {}),
        });
        const payload = await parseResponse(response);
        return {
            data: (payload.data ?? null) as TData,
        };
    },
    deleteOne: async <TData = any>({ resource, id }: DeleteOneParams) => {
        const response = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        await parseResponse(response);
        return {
            data: { id } as TData,
        };
    },
    custom: async ({ url, method, meta, payload }: any) => {
        const requestUrl = url ? `${API_BASE}${url}` : API_BASE;
        const response = await fetch(requestUrl, {
            method: method ?? "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(meta?.headers ?? {}),
            },
            body: payload ? JSON.stringify(payload) : undefined,
        });
        const data = await parseResponse(response);
        return data;
    },
    getApiUrl: () => API_BASE,
} as unknown as DataProvider;
