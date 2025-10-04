"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type BaseRecord = Record<string, any>;
export type HttpError = Error;

export interface Pagination {
    current?: number;
    pageSize?: number;
}

export interface Filter {
    field?: string | number | symbol;
    operator?: string;
    value?: unknown;
}

export interface Sorter {
    field?: string | number | symbol;
    order?: "asc" | "desc";
}

export interface GetListParams {
    resource: string;
    pagination?: Pagination;
    filters?: Filter[];
    sorters?: Sorter[];
    queryOptions?: Record<string, unknown>;
}

export interface GetOneParams {
    resource: string;
    id: string | number;
    queryOptions?: Record<string, unknown>;
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
    queryOptions?: Record<string, unknown>;
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

export interface AuthBindings {
    login?: (
        params: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    logout?: (
        params: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    check?: (
        params?: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    onError?: (
        error: Error | { message?: string },
    ) => Promise<Record<string, unknown>>;
    getIdentity?: () => Promise<unknown>;
    getPermissions?: () => Promise<unknown>;
}

export interface RefineResourceMeta extends Record<string, unknown> {
    label?: string;
    icon?: string;
    group?: string;
    order?: number;
    hide?: boolean;
}

export interface RefineResource {
    name: string;
    list?: string;
    create?: string;
    edit?: string;
    show?: string;
    meta?: RefineResourceMeta;
}

interface RefineContextValue {
    dataProvider?: DataProvider;
    notificationProvider?: NotificationProvider;
    resources: RefineResource[];
}

const RefineContext = createContext<RefineContextValue>({ resources: [] });

export interface RefineProps {
    children: ReactNode;
    dataProvider?: DataProvider;
    notificationProvider?: NotificationProvider;
    resources?: RefineResource[];
    authProvider?: AuthBindings;
    routerProvider?: unknown;
    options?: Record<string, unknown>;
}

export function Refine({
    children,
    dataProvider,
    notificationProvider,
    resources = [],
}: RefineProps) {
    const value = useMemo(
        () => ({ dataProvider, notificationProvider, resources }),
        [dataProvider, notificationProvider, resources],
    );

    return (
        <RefineContext.Provider value={value}>
            {children}
        </RefineContext.Provider>
    );
}

function useRefineContext() {
    return useContext(RefineContext);
}

function toError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(typeof error === "string" ? error : "Unexpected error");
}

export function useNotification() {
    const { notificationProvider } = useRefineContext();
    const open = useCallback(
        (params: NotificationPayload) => {
            if (notificationProvider?.open) {
                notificationProvider.open(params);
            }
        },
        [notificationProvider],
    );
    const close = useCallback(
        (key?: string | number) => {
            notificationProvider?.close?.(key);
        },
        [notificationProvider],
    );

    return { open, close };
}

function useSerializedParams(params: unknown) {
    return useMemo(() => JSON.stringify(params ?? {}), [params]);
}

export function useList<TData = BaseRecord>(params: GetListParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<{ data: TData[]; total: number }>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const serialized = useSerializedParams(params);

    const execute = useCallback(async () => {
        if (!dataProvider?.getList) {
            setData({ data: [], total: 0 });
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await dataProvider.getList<TData>(params);
            setData({
                data: response.data ?? [],
                total:
                    response.total ??
                    (Array.isArray(response.data) ? response.data.length : 0),
            });
            setError(null);
        } catch (err) {
            setError(toError(err));
            setData({ data: [], total: 0 });
        } finally {
            setIsLoading(false);
        }
    }, [dataProvider, params]);

    useEffect(() => {
        void execute();
    }, [execute, serialized]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    return {
        data,
        error,
        isLoading,
        refetch,
    };
}

export function useOne<TData = BaseRecord>(params: GetOneParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<TData>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const serialized = useSerializedParams(params);

    const execute = useCallback(async () => {
        if (!dataProvider?.getOne) {
            setData(undefined);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await dataProvider.getOne<TData>(params);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(toError(err));
            setData(undefined);
        } finally {
            setIsLoading(false);
        }
    }, [dataProvider, params]);

    useEffect(() => {
        void execute();
    }, [execute, serialized]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    return {
        data,
        error,
        isLoading,
        refetch,
    };
}

export function useCustom<TData = BaseRecord>(params: CustomParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<{ data?: TData }>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const serialized = useSerializedParams(params);

    const execute = useCallback(async () => {
        if (!dataProvider?.custom) {
            setData({});
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response = await dataProvider.custom<TData>(params);
            setData(
                response && typeof response === "object" && "data" in response
                    ? (response as { data?: TData })
                    : { data: response as TData },
            );
            setError(null);
        } catch (err) {
            setError(toError(err));
            setData({});
        } finally {
            setIsLoading(false);
        }
    }, [dataProvider, params]);

    useEffect(() => {
        void execute();
    }, [execute, serialized]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    return {
        data,
        error,
        isLoading,
        refetch,
    };
}

type CreatePayload<TVariables> = {
    resource: string;
    values?: TVariables;
};

type UpdatePayload<TVariables> = {
    resource: string;
    id: string | number;
    values?: TVariables;
};

type DeletePayload = {
    resource: string;
    id: string | number;
};

type MutationCallbacks<TResponse> = {
    onSuccess?: (data: TResponse) => void;
    onError?: (error: Error) => void;
};

export function useCreate<TData = BaseRecord, TVariables = unknown>() {
    const { dataProvider } = useRefineContext();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const mutateAsync = useCallback(
        async ({ resource, values }: CreatePayload<TVariables>) => {
            if (!dataProvider?.create) {
                throw new Error("Data provider is not configured");
            }
            setIsLoading(true);
            try {
                const response = await dataProvider.create<TData>({
                    resource,
                    variables: values,
                });
                return response;
            } finally {
                setIsLoading(false);
            }
        },
        [dataProvider],
    );

    const mutate = useCallback(
        async (
            payload: CreatePayload<TVariables>,
            options?: MutationCallbacks<unknown>,
        ) => {
            try {
                const result = await mutateAsync(payload);
                options?.onSuccess?.(result);
                return result;
            } catch (error) {
                options?.onError?.(toError(error));
                throw error;
            }
        },
        [mutateAsync],
    );

    return { mutateAsync, mutate, isLoading };
}

export function useUpdate<TData = BaseRecord, TVariables = unknown>() {
    const { dataProvider } = useRefineContext();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const mutateAsync = useCallback(
        async ({ resource, id, values }: UpdatePayload<TVariables>) => {
            if (!dataProvider?.update) {
                throw new Error("Data provider is not configured");
            }
            setIsLoading(true);
            try {
                const response = await dataProvider.update<TData>({
                    resource,
                    id,
                    variables: values,
                });
                return response;
            } finally {
                setIsLoading(false);
            }
        },
        [dataProvider],
    );

    const mutate = useCallback(
        async (
            payload: UpdatePayload<TVariables>,
            options?: MutationCallbacks<unknown>,
        ) => {
            try {
                const result = await mutateAsync(payload);
                options?.onSuccess?.(result);
                return result;
            } catch (error) {
                options?.onError?.(toError(error));
                throw error;
            }
        },
        [mutateAsync],
    );

    return { mutateAsync, mutate, isLoading };
}

export function useDelete<TData = BaseRecord>() {
    const { dataProvider } = useRefineContext();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const mutateAsync = useCallback(
        async ({ resource, id }: DeletePayload) => {
            if (!dataProvider?.deleteOne) {
                throw new Error("Data provider is not configured");
            }
            setIsLoading(true);
            try {
                const response = await dataProvider.deleteOne<TData>({
                    resource,
                    id,
                });
                return response;
            } finally {
                setIsLoading(false);
            }
        },
        [dataProvider],
    );

    const mutate = useCallback(
        async (
            payload: DeletePayload,
            options?: MutationCallbacks<unknown>,
        ) => {
            try {
                const result = await mutateAsync(payload);
                options?.onSuccess?.(result);
                return result;
            } catch (error) {
                options?.onError?.(toError(error));
                throw error;
            }
        },
        [mutateAsync],
    );

    return { mutateAsync, mutate, isLoading };
}

export function useMenu() {
    const { resources } = useRefineContext();
    const menuItems = useMemo(() => {
        return resources.map((resource) => ({
            key: resource.name,
            name: resource.name,
            label: resource.meta?.label ?? resource.name,
            route:
                resource.list ??
                resource.show ??
                resource.edit ??
                resource.create ??
                "",
            meta: resource.meta ?? {},
        }));
    }, [resources]);

    return { menuItems };
}
