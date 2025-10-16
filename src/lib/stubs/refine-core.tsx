"use client";

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type BaseRecord = Record<string, unknown>;
export type HttpError = Error;

export interface Pagination {
    current?: number;
    page?: number;
    pageSize?: number;
}

export interface Filter {
    field?: string | number | symbol;
    operator?: string;
    value?: unknown;
}

export type CrudFilter = Filter;
export type CrudFilters = CrudFilter[];

export interface Sorter {
    field?: string | number | symbol;
    order?: "asc" | "desc";
}

export interface QueryOptions {
    enabled?: boolean;
    [key: string]: unknown;
}

export interface GetListParams {
    resource: string;
    pagination?: Pagination;
    filters?: Filter[];
    sorters?: Sorter[];
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

function useHasHydrated() {
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    return hasHydrated;
}

type QueryLike<TData> = {
    data: TData;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => Promise<void>;
};

function useQueryLike<TData>(config: {
    data: TData;
    error: Error | null;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => Promise<void>;
}): QueryLike<TData> {
    const { data, error, isLoading, isFetching, refetch } = config;

    return useMemo(
        () => ({
            data,
            error,
            isLoading,
            isFetching,
            refetch,
        }),
        [data, error, isFetching, isLoading, refetch],
    );
}

type ListResponse<TData> = { data: TData[]; total: number } | undefined;
type OneResponse<TData> = { data: TData } | undefined;
type CustomResponse<TData> = { data?: TData } | undefined;

export function useList<TData = BaseRecord>(params: GetListParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<ListResponse<TData>>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoadingState, setIsLoadingState] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const hasFetchedRef = useRef<boolean>(false);
    const hasHydrated = useHasHydrated();
    const serializedParams = useSerializedParams(params);
    const stableParams = useMemo(() => params, [params]);
    const paramsKeyRef = useRef<string | undefined>();

    useEffect(() => {
        if (paramsKeyRef.current === serializedParams) {
            return;
        }
        paramsKeyRef.current = serializedParams;
        hasFetchedRef.current = false;
        setIsLoadingState(true);
        setIsFetching(false);
        setError(null);
        setData(undefined);
    }, [serializedParams]);

    const execute = useCallback(async () => {
        const enabled = stableParams.queryOptions?.enabled ?? true;
        if (!enabled) {
            setIsFetching(false);
            setIsLoadingState(!hasFetchedRef.current);
            return;
        }
        if (!dataProvider?.getList) {
            setData({ data: [], total: 0 });
            setError(null);
            setIsFetching(false);
            setIsLoadingState(false);
            hasFetchedRef.current = true;
            return;
        }
        const hasExistingData = hasFetchedRef.current;
        setIsFetching(true);
        setIsLoadingState(!hasExistingData);
        try {
            const response = await dataProvider.getList<TData>(stableParams);
            setData({
                data: response.data ?? [],
                total:
                    response.total ??
                    (Array.isArray(response.data) ? response.data.length : 0),
            });
            setError(null);
            hasFetchedRef.current = true;
        } catch (err) {
            setError(toError(err));
            if (!hasExistingData) {
                setData({ data: [], total: 0 });
            }
            hasFetchedRef.current = true;
        } finally {
            setIsFetching(false);
            setIsLoadingState(false);
        }
    }, [dataProvider, stableParams]);

    useEffect(() => {
        void execute();
    }, [execute]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    const query = useQueryLike<ListResponse<TData>>({
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
    });

    return {
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
        query,
        queryResult: query,
        result: data,
    };
}

export function useOne<TData = BaseRecord>(params: GetOneParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<OneResponse<TData>>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoadingState, setIsLoadingState] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const hasFetchedRef = useRef<boolean>(false);
    const hasHydrated = useHasHydrated();
    const serializedParams = useSerializedParams(params);
    const stableParams = useMemo(() => params, [params]);
    const paramsKeyRef = useRef<string | undefined>();

    useEffect(() => {
        if (paramsKeyRef.current === serializedParams) {
            return;
        }
        paramsKeyRef.current = serializedParams;
        hasFetchedRef.current = false;
        setIsLoadingState(true);
        setIsFetching(false);
        setError(null);
        setData(undefined);
    }, [serializedParams]);

    const execute = useCallback(async () => {
        const enabled = stableParams.queryOptions?.enabled ?? true;
        if (!enabled) {
            setIsFetching(false);
            setIsLoadingState(!hasFetchedRef.current);
            return;
        }
        if (!dataProvider?.getOne) {
            setData(undefined);
            setError(null);
            setIsFetching(false);
            setIsLoadingState(false);
            hasFetchedRef.current = true;
            return;
        }
        const hasExistingData = hasFetchedRef.current;
        setIsFetching(true);
        setIsLoadingState(!hasExistingData);
        try {
            const response = await dataProvider.getOne<TData>(stableParams);
            setData(response);
            setError(null);
            hasFetchedRef.current = true;
        } catch (err) {
            setError(toError(err));
            if (!hasExistingData) {
                setData(undefined);
            }
            hasFetchedRef.current = true;
        } finally {
            setIsFetching(false);
            setIsLoadingState(false);
        }
    }, [dataProvider, stableParams]);

    useEffect(() => {
        void execute();
    }, [execute]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    const query = useQueryLike<OneResponse<TData>>({
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
    });

    return {
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
        query,
        queryResult: query,
        result: data,
    };
}

export function useCustom<TData = BaseRecord>(params: CustomParams) {
    const { dataProvider } = useRefineContext();
    const [data, setData] = useState<CustomResponse<TData>>();
    const [error, setError] = useState<Error | null>(null);
    const [isLoadingState, setIsLoadingState] = useState<boolean>(true);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const hasFetchedRef = useRef<boolean>(false);
    const hasHydrated = useHasHydrated();
    const serializedParams = useSerializedParams(params);
    const stableParams = useMemo(() => params, [params]);
    const paramsKeyRef = useRef<string | undefined>();

    useEffect(() => {
        if (paramsKeyRef.current === serializedParams) {
            return;
        }
        paramsKeyRef.current = serializedParams;
        hasFetchedRef.current = false;
        setIsLoadingState(true);
        setIsFetching(false);
        setError(null);
        setData(undefined);
    }, [serializedParams]);

    const execute = useCallback(async () => {
        const enabled = stableParams.queryOptions?.enabled ?? true;
        if (!enabled) {
            setIsFetching(false);
            setIsLoadingState(!hasFetchedRef.current);
            return;
        }
        if (!dataProvider?.custom) {
            setData({});
            setError(null);
            setIsFetching(false);
            setIsLoadingState(false);
            hasFetchedRef.current = true;
            return;
        }
        const hasExistingData = hasFetchedRef.current;
        setIsFetching(true);
        setIsLoadingState(!hasExistingData);
        try {
            const response = await dataProvider.custom<TData>(stableParams);
            setData(
                response && typeof response === "object" && "data" in response
                    ? (response as { data?: TData })
                    : { data: response as TData },
            );
            setError(null);
            hasFetchedRef.current = true;
        } catch (err) {
            setError(toError(err));
            if (!hasExistingData) {
                setData({});
            }
            hasFetchedRef.current = true;
        } finally {
            setIsFetching(false);
            setIsLoadingState(false);
        }
    }, [dataProvider, stableParams]);

    useEffect(() => {
        void execute();
    }, [execute]);

    const refetch = useCallback(async () => {
        await execute();
    }, [execute]);

    const query = useQueryLike<CustomResponse<TData>>({
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
    });

    return {
        data,
        error,
        isLoading: !hasHydrated || isLoadingState,
        isFetching,
        refetch,
        query,
        queryResult: query,
        result: data,
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
