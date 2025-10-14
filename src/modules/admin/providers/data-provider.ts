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
        for (const filter of params.filters) {
            if (!filter) continue;
            if (filter.field !== undefined) {
                if (filter.value !== undefined && filter.value !== null) {
                    const val = filter.value as unknown;
                    if (
                        typeof val === "string" ||
                        typeof val === "number" ||
                        typeof val === "boolean"
                    ) {
                        searchParams.append(String(filter.field), String(val));
                    }
                }
                continue;
            }
            if (
                (filter.operator === "or" || filter.operator === "and") &&
                Array.isArray(filter.value)
            ) {
                for (const inner of filter.value) {
                    if (
                        inner &&
                        typeof inner === "object" &&
                        "field" in inner &&
                        (inner as Filter).field !== undefined
                    ) {
                        const innerFilter = inner as Filter;
                        const v = innerFilter.value as unknown;
                        if (v !== undefined && v !== null) {
                            if (
                                typeof v === "string" ||
                                typeof v === "number" ||
                                typeof v === "boolean"
                            ) {
                                searchParams.append(
                                    String(innerFilter.field),
                                    String(v),
                                );
                            }
                        }
                    }
                }
            }
        }
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
        let total: number;
        if (typeof payload.total === "number") {
            total = payload.total;
        } else if (Array.isArray(rawData)) {
            total = rawData.length;
        } else {
            total = items.length;
        }
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
    custom: async <TData = Record<string, unknown>>({
        url,
        method,
        meta,
        payload,
    }: CustomParams): Promise<TData | { data?: TData }> => {
        const requestUrl = url ? `${API_BASE}${url}` : API_BASE;
        const extraHeaders = (meta?.headers ?? undefined) as
            | Record<string, string>
            | undefined;
        const headersObj: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (extraHeaders) Object.assign(headersObj, extraHeaders);

        const response = await fetch(requestUrl, {
            method: method ?? "GET",
            credentials: "include",
            headers: headersObj,
            body: payload ? JSON.stringify(payload) : undefined,
        });
        const parsed = (await parseResponse(response)) as Record<
            string,
            unknown
        >;
        if (typeof parsed === "object" && "data" in parsed) {
            return parsed as { data?: TData };
        }
        return parsed as TData;
    },
    getApiUrl: () => API_BASE,
} satisfies Required<DataProvider>;
