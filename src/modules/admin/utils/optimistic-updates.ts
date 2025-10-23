/**
 * Optimistic update helpers for the admin dashboard.
 * 提供一组带有乐观更新语义的 React Query 工具，统一缓存更新、回滚与提示。
 */

import {
    QueryClient,
    useMutation,
    useQueryClient,
    type MutationFunction,
    type QueryKey,
} from "@tanstack/react-query";

import { toast } from "@/lib/toast";

type MutationContext = {
    previousData: unknown;
    optimisticContext?: unknown;
};

type ApplyResult = {
    data: unknown;
    context?: unknown;
};

interface OptimisticMutationOptions<TResult, TVariables> {
    queryKey: QueryKey;
    mutationFn: MutationFunction<TResult, TVariables>;
    /**
     * 生成乐观数据。
     * 返回的数据会立即写入缓存，context 会在成功或失败回调中传回。
     */
    applyOptimistic: (
        currentValue: unknown,
        variables: TVariables,
    ) => ApplyResult;
    /**
     * 可选：当真实结果返回后如何与乐观数据合并。
     * 返回 undefined 表示沿用当前缓存值。
     */
    reconcile?: (
        currentValue: unknown,
        serverData: TResult,
        variables: TVariables,
        optimisticContext?: unknown,
    ) => unknown | void;
    /**
     * 可选：当请求失败时执行额外回滚逻辑。
     * 返回值将重新写入缓存；若返回 undefined 则使用原始 previousData。
     */
    rollback?: (
        previousValue: unknown,
        variables: TVariables,
        optimisticContext?: unknown,
    ) => unknown | void;
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: TResult, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    /**
     * 是否在 onSettled 后失效查询（默认 true）。
     */
    invalidateOnSettled?: boolean;
}

const toError = (error: unknown): Error =>
    error instanceof Error ? error : new Error(String(error ?? "Unknown error"));

const ensureArray = <T>(value: unknown): T[] =>
    Array.isArray(value) ? [...value] : [];

/**
 * 通用的乐观更新 Hook。
 */
export function useOptimisticMutation<TResult, TVariables>(
    options: OptimisticMutationOptions<TResult, TVariables>,
) {
    const queryClient = useQueryClient();

    return useMutation<TResult, Error, TVariables, MutationContext>({
        mutationFn: options.mutationFn,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: options.queryKey });

            const previousData = queryClient.getQueryData(options.queryKey);
            const { data, context } = options.applyOptimistic(
                previousData,
                variables,
            );

            queryClient.setQueryData(options.queryKey, data);

            return {
                previousData,
                optimisticContext: context,
            };
        },
        onError: (rawError, variables, context) => {
            const error = toError(rawError);

            if (context?.previousData !== undefined) {
                queryClient.setQueryData(options.queryKey, context.previousData);
            }

            if (options.rollback) {
                const rollbackValue = options.rollback(
                    context?.previousData,
                    variables,
                    context?.optimisticContext,
                );
                if (rollbackValue !== undefined) {
                    queryClient.setQueryData(options.queryKey, rollbackValue);
                }
            }

            toast.error(options.errorMessage ?? error.message);
            options.onError?.(error, variables);
        },
        onSuccess: (data, variables, context) => {
            if (options.reconcile) {
                const currentValue = queryClient.getQueryData(options.queryKey);
                const reconciled = options.reconcile(
                    currentValue,
                    data,
                    variables,
                    context?.optimisticContext,
                );

                if (reconciled !== undefined) {
                    queryClient.setQueryData(options.queryKey, reconciled);
                }
            }

            if (options.successMessage) {
                toast.success(options.successMessage);
            }

            options.onSuccess?.(data, variables);
        },
        onSettled: () => {
            if (options.invalidateOnSettled ?? true) {
                queryClient.invalidateQueries({ queryKey: options.queryKey });
            }
        },
    });
}

/**
 * 统一的删除操作乐观更新。
 */
export function useOptimisticDelete<TResult = void>(
    queryKey: QueryKey,
    deleteFn: (id: string | number) => Promise<TResult>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        idField?: string;
    },
) {
    const idField = options?.idField ?? "id";

    return useOptimisticMutation<TResult, string | number>({
        queryKey,
        mutationFn: deleteFn,
        applyOptimistic: (currentValue, id) => {
            const list = ensureArray<any>(currentValue);
            const next = list.filter((item) => item?.[idField] !== id);
            const removed = list.find((item) => item?.[idField] === id);
            return {
                data: next,
                context: removed,
            };
        },
        reconcile: () => undefined,
        rollback: (previousValue) => previousValue,
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
    });
}

/**
 * 统一的更新操作乐观更新。
 */
export function useOptimisticUpdateItem<
    TResult extends Record<string, unknown>,
    TVariables extends Record<string, unknown>,
>(
    queryKey: QueryKey,
    updateFn: (variables: TVariables) => Promise<TResult>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        matchBy?: string;
    },
) {
    const matchBy = options?.matchBy ?? "id";

    return useOptimisticMutation<TResult, TVariables>({
        queryKey,
        mutationFn: updateFn,
        applyOptimistic: (currentValue, variables) => {
            const list = ensureArray<Record<string, unknown>>(currentValue);
            const matchValue = variables?.[matchBy];

            const next = list.map((item) =>
                item?.[matchBy] === matchValue
                    ? { ...item, ...variables }
                    : item,
            );

            return {
                data: next,
                context: { matchValue },
            };
        },
        reconcile: (currentValue, serverData, variables, optimistic) => {
            if (!serverData || typeof serverData !== "object") {
                return currentValue;
            }
            const list = ensureArray<Record<string, unknown>>(currentValue);
            const matchValue =
                (optimistic as { matchValue?: unknown })?.matchValue ??
                variables?.[matchBy];

            return list.map((item) =>
                item?.[matchBy] === matchValue
                    ? { ...item, ...serverData }
                    : item,
            );
        },
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
    });
}

/**
 * 创建操作的乐观更新。
 */
export function useOptimisticCreate<
    TResult extends Record<string, unknown>,
    TVariables extends Record<string, unknown>,
>(
    queryKey: QueryKey,
    createFn: (variables: TVariables) => Promise<TResult>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        tempIdFactory?: () => string;
        idField?: string;
        prepend?: boolean;
    },
) {
    const idField = options?.idField ?? "id";
    const buildTempId = options?.tempIdFactory ?? (() => `temp-${Date.now()}`);

    return useOptimisticMutation<TResult, TVariables>({
        queryKey,
        mutationFn: createFn,
        applyOptimistic: (currentValue, variables) => {
            const list = ensureArray<Record<string, unknown>>(currentValue);
            const tempId = buildTempId();
            const optimisticItem: Record<string, unknown> = {
                ...variables,
                [idField]: tempId,
                _temp: true,
                createdAt:
                    (variables as { createdAt?: string })?.createdAt ??
                    new Date().toISOString(),
            };

            const data = options?.prepend
                ? [optimisticItem, ...list]
                : [...list, optimisticItem];

            return {
                data,
                context: { tempId },
            };
        },
        reconcile: (currentValue, serverData, _variables, optimistic) => {
            if (!serverData || typeof serverData !== "object") {
                return currentValue;
            }

            const list = ensureArray<Record<string, unknown>>(currentValue);
            const tempId = (optimistic as { tempId?: string })?.tempId;

            return list.map((item) => {
                const isTempMatch =
                    item?._temp && (!tempId || item?.[idField] === tempId);
                return isTempMatch
                    ? { ...serverData, _temp: false }
                    : item;
            });
        },
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
    });
}

/**
 * 批量操作的乐观更新。
 */
export function useOptimisticBatch<TResult, TVariables>(
    queryKey: QueryKey,
    batchFn: (variables: TVariables) => Promise<TResult>,
    options: {
        applyOptimistic: (
            currentValue: unknown,
            variables: TVariables,
        ) => unknown;
        reconcile?: (
            currentValue: unknown,
            serverData: TResult,
            variables: TVariables,
        ) => unknown | void;
        successMessage?: string;
        errorMessage?: string;
    },
) {
    return useOptimisticMutation<TResult, TVariables>({
        queryKey,
        mutationFn: batchFn,
        applyOptimistic: (currentValue, variables) => ({
            data: options.applyOptimistic(currentValue, variables),
        }),
        reconcile: options.reconcile,
        successMessage: options.successMessage,
        errorMessage: options.errorMessage,
    });
}

interface ToggleVariables {
    id: string | number;
    field: string;
    value: unknown;
}

/**
 * 列表项状态切换的乐观更新。
 */
export function useOptimisticToggle<TResult>(
    queryKey: QueryKey,
    toggleFn: (variables: ToggleVariables) => Promise<TResult>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
    },
) {
    return useOptimisticMutation<TResult, ToggleVariables>({
        queryKey,
        mutationFn: toggleFn,
        applyOptimistic: (currentValue, variables) => {
            const list = ensureArray<Record<string, unknown>>(currentValue);
            const next = list.map((item) =>
                item?.id === variables.id
                    ? { ...item, [variables.field]: variables.value }
                    : item,
            );

            return {
                data: next,
                context: { id: variables.id },
            };
        },
        reconcile: (currentValue, serverData, variables) => {
            if (!serverData || typeof serverData !== "object") {
                return currentValue;
            }

            const list = ensureArray<Record<string, unknown>>(currentValue);
            return list.map((item) =>
                item?.id === variables.id
                    ? { ...item, ...serverData }
                    : item,
            );
        },
        successMessage: options?.successMessage,
        errorMessage: options?.errorMessage,
    });
}

/**
 * 针对常见仪表盘操作的快捷 Hook。
 */
export const DashboardOptimisticUpdates = {
    useUpdateOrderStatus: () =>
        useOptimisticToggle(
            ["orders"],
            async ({ id, value }) => {
                const response = await fetch(`/api/v1/admin/orders/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: value }),
                });

                if (!response.ok) {
                    throw new Error("订单状态更新失败");
                }

                return response.json();
            },
            {
                successMessage: "订单状态已更新",
                errorMessage: "订单状态更新失败",
            },
        ),

    useAddCredits: () =>
        useOptimisticCreate(
            ["credits-history"],
            async (payload: {
                userId: string;
                amount: number;
                type: string;
            }) => {
                const response = await fetch("/api/v1/admin/credits-history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error("积分添加失败");
                }

                return response.json();
            },
            {
                prepend: true,
                successMessage: "积分已添加",
                errorMessage: "积分添加失败",
            },
        ),

    useUpdateProduct: () =>
        useOptimisticUpdateItem(
            ["products"],
            async (payload: Record<string, unknown>) => {
                const response = await fetch(
                    `/api/v1/admin/products/${payload.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    },
                );

                if (!response.ok) {
                    throw new Error("产品更新失败");
                }

                return response.json();
            },
            {
                successMessage: "产品信息已更新",
                errorMessage: "产品更新失败",
            },
        ),

    useDeleteCoupon: () =>
        useOptimisticDelete(
            ["coupons"],
            async (id: number) => {
                const response = await fetch(
                    `/api/v1/admin/coupons/${id}`,
                    { method: "DELETE" },
                );

                if (!response.ok) {
                    throw new Error("优惠券删除失败");
                }

                return response.json();
            },
            {
                successMessage: "优惠券已删除",
                errorMessage: "优惠券删除失败",
            },
        ),
};

interface ManagerExecuteConfig<TResult, TVariables>
    extends Omit<
        OptimisticMutationOptions<TResult, TVariables>,
        "mutationFn"
    > {
    mutationFn: MutationFunction<TResult, TVariables>;
    variables: TVariables;
}

/**
 * Imperative 风格的乐观更新管理器，方便在非 React 组件中复用。
 */
export class OptimisticUpdateManager {
    constructor(private readonly queryClient: QueryClient) {}

    async execute<TResult, TVariables>({
        queryKey,
        mutationFn,
        variables,
        applyOptimistic,
        reconcile,
        rollback,
        successMessage,
        errorMessage,
        onSuccess,
        onError,
        invalidateOnSettled,
    }: ManagerExecuteConfig<TResult, TVariables>): Promise<TResult> {
        await this.queryClient.cancelQueries({ queryKey });

        const previousData = this.queryClient.getQueryData(queryKey);
        const { data, context } = applyOptimistic(previousData, variables);
        this.queryClient.setQueryData(queryKey, data);

        try {
            const result = await mutationFn(variables);

            if (reconcile) {
                const currentValue = this.queryClient.getQueryData(queryKey);
                const nextValue = reconcile(
                    currentValue,
                    result,
                    variables,
                    context,
                );
                if (nextValue !== undefined) {
                    this.queryClient.setQueryData(queryKey, nextValue);
                }
            }

            if (successMessage) {
                toast.success(successMessage);
            }

            onSuccess?.(result, variables);
            return result;
        } catch (rawError) {
            const error = toError(rawError);
            this.queryClient.setQueryData(queryKey, previousData);

            if (rollback) {
                const rollbackValue = rollback(
                    previousData,
                    variables,
                    context,
                );
                if (rollbackValue !== undefined) {
                    this.queryClient.setQueryData(queryKey, rollbackValue);
                }
            }

            toast.error(errorMessage ?? error.message);
            onError?.(error, variables);
            throw error;
        } finally {
            if (invalidateOnSettled ?? true) {
                this.queryClient.invalidateQueries({ queryKey });
            }
        }
    }
}

export default OptimisticUpdateManager;
