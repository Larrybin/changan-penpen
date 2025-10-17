export type AdminListPayload<TData> =
    | { data?: TData[]; total?: number }
    | TData[]
    | null
    | undefined;

export type AdminSinglePayload<TData> =
    | { data?: TData | null }
    | TData
    | null
    | undefined;

export function resolveAdminListPayload<TData>(
    payload: AdminListPayload<TData>,
) {
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

export function resolveAdminSinglePayload<TData>(
    payload: AdminSinglePayload<TData>,
) {
    if (payload && typeof payload === "object" && "data" in payload) {
        return (payload as { data?: TData | null }).data ?? null;
    }
    return (payload as TData | null | undefined) ?? null;
}
