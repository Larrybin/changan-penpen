export type BaseRecord = Record<string, unknown>;

export interface Pagination {
    current?: number;
    page?: number;
    pageSize?: number;
}

export interface CrudFilter {
    field?: string | number | symbol;
    operator?: string;
    value?: unknown;
}

export type CrudFilters = CrudFilter[];

export interface Sorter {
    field?: string | number | symbol;
    order?: "asc" | "desc";
}

export type CrudSorting = Sorter[];

export interface QueryOptions {
    enabled?: boolean;
    [key: string]: unknown;
}

export interface GetListParams {
    resource: string;
    pagination?: Pagination;
    filters?: CrudFilters;
    sorters?: CrudSorting;
    queryOptions?: QueryOptions;
}

export interface GetOneParams {
    resource: string;
    id: string | number;
    queryOptions?: QueryOptions;
}

export interface CreateParams<TVariables = unknown> {
    resource: string;
    variables?: TVariables;
}

export interface UpdateParams<TVariables = unknown> {
    resource: string;
    id: string | number;
    variables?: TVariables;
}

export interface DeleteOneParams {
    resource: string;
    id: string | number;
}

export interface CustomParams<TPayload = unknown> {
    url?: string;
    method?: string;
    payload?: TPayload;
    meta?: { headers?: Record<string, string> };
    queryOptions?: QueryOptions;
}

export interface DataProvider {
    getList?: <TData = BaseRecord>(
        params: GetListParams,
    ) => Promise<{ data: TData[]; total?: number }>;
    getOne?: <TData = BaseRecord>(
        params: GetOneParams,
    ) => Promise<{ data: TData }>;
    create?: <TData = BaseRecord>(
        params: CreateParams,
    ) => Promise<{ data: TData }>;
    update?: <TData = BaseRecord>(
        params: UpdateParams,
    ) => Promise<{ data: TData }>;
    deleteOne?: <TData = BaseRecord>(
        params: DeleteOneParams,
    ) => Promise<{ data: TData }>;
    custom?: <TData = BaseRecord>(
        params: CustomParams,
    ) => Promise<{ data?: TData } | TData>;
    getApiUrl?: () => string;
}

export interface NotificationPayload {
    message?: string;
    description?: string;
    type?: "success" | "error" | "info" | "warning";
    key?: string | number;
}

export interface NotificationProvider {
    open?: (params: NotificationPayload) => void;
    close?: (key?: string | number) => void;
}
