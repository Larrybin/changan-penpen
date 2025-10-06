import type {
    CreateParams,
    DataProvider,
    DeleteOneParams,
    Filter,
    GetListParams,
    GetOneParams,
    UpdateParams,
} from "@refinedev/core";

type CustomParams = Parameters<NonNullable<DataProvider["custom"]>>[0];
type CustomReturn = ReturnType<NonNullable<DataProvider["custom"]>>;

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
        const { current, page, pageSize } = params.pagination;
        const currentPage = current ?? page;
        if (current) {
            searchParams.set("page", `${current}`);
        } else if (currentPage) {
            searchParams.set("page", `${currentPage}`);
        }
        if (pageSize) {
            searchParams.set("perPage", `${pageSize}`);
        }
    }

    if (params.filters) {
        params.filters.forEach((filter) => {
            if (!filter) {
                return;
            }
            if (typeof filter.field !== "undefined") {
                if (filter.value !== undefined && filter.value !== null) {
                    searchParams.append(
                        String(filter.field),
                        String(filter.value),
                    );
                }
                return;
            }
            if (
                (filter.operator === "or" || filter.operator === "and") &&
                Array.isArray(filter.value)
            ) {
                filter.value.forEach((inner) => {
                    if (
                        inner &&
                        typeof inner === "object" &&
                        "field" in inner &&
                        (inner as Filter).field !== undefined
                    ) {
                        const innerFilter = inner as Filter;
                        if (
                            innerFilter.value !== undefined &&
                            innerFilter.value !== null
                        ) {
                            searchParams.append(
                                String(innerFilter.field),
                                String(innerFilter.value),
                            );
                        }
                    }
                });
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
    getList: async <TData = Record<string, unknown>>(params: GetListParams) => {
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
    getOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: GetOneParams) => {
        const response = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: "GET",
            credentials: "include",
        });
        const payload = await parseResponse(response);
        return {
            data: (payload.data ?? null) as TData,
        };
    },
    create: async <TData = Record<string, unknown>>({
        resource,
        variables,
    }: CreateParams) => {
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
    update: async <TData = Record<string, unknown>>({
        resource,
        id,
        variables,
    }: UpdateParams) => {
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
    deleteOne: async <TData = Record<string, unknown>>({
        resource,
        id,
    }: DeleteOneParams) => {
        const response = await fetch(`${API_BASE}/${resource}/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        await parseResponse(response);
        return {
            data: { id } as TData,
        };
    },
    custom: async ({ url, method, meta, payload }: CustomParams) => {
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
        return (await parseResponse(response)) as Awaited<CustomReturn>;
    },
    getApiUrl: () => API_BASE,
} as unknown as DataProvider;
