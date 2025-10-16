/**
 * useServerAction - Server Actions 状态同步 Hook
 *
 * 结合 nuqs 实现服务端操作状态与 URL 查询参数的同步
 *
 * @example
 * ```tsx
 * const { execute, isPending, error, data } = useServerAction({
 *   action: createTodo,
 *   queryKey: "createTodo",
 *   onSuccess: (data) => {
 *     toast.success("创建成功");
 *   },
 *   onError: (error) => {
 *     toast.error("创建失败");
 *   }
 * });
 *
 * const handleSubmit = async (formData: FormData) => {
 *   await execute({ name: "新任务" });
 * };
 * ```
 */

"use client";

import { useQueryStates } from "nuqs";
import { startTransition, useCallback, useState } from "react";
import { toast } from "@/lib/toast";

type QueryParserConfig<TValue> = {
    defaultValue?: TValue;
    parse?: (value: string) => TValue;
    serialize?: (value: TValue) => string;
};

type QueryParserSchema<T extends Record<string, unknown>> = {
    [K in keyof T]: QueryParserConfig<T[K]>;
};

type QueryParsers<T extends Record<string, unknown>> = {
    [K in keyof T]: {
        defaultValue?: T[K];
        parse: (value: string) => T[K];
        serialize: (value: T[K]) => string;
    };
};

// 查询参数解析器
export const createQueryParsers = <T extends Record<string, unknown>>(
    schema: QueryParserSchema<T>,
): QueryParsers<T> => {
    const parsers = {} as QueryParsers<T>;

    (Object.keys(schema) as Array<keyof T>).forEach((key) => {
        const config = schema[key];
        parsers[key] = {
            defaultValue: config.defaultValue,
            parse: config.parse ?? ((value: string) => value as T[typeof key]),
            serialize:
                config.serialize ?? ((value: T[typeof key]) => String(value)),
        };
    });

    return parsers;
};

interface UseServerActionOptions<TInput, TOutput> {
    // Server Action 函数
    action: (input: TInput) => Promise<TOutput>;

    // 查询参数键名
    queryKey?: string | string[];

    // 初始状态
    initialData?: TOutput;

    // 成功回调
    onSuccess?: (data: TOutput, input: TInput) => void | Promise<void>;

    // 错误回调
    onError?: (error: Error, input: TInput) => void | Promise<void>;

    // 开始回调
    onExecute?: (input: TInput) => void;

    // 完成回调 (无论成功失败)
    onFinally?: () => void;

    // 是否显示 toast 通知
    showToast?:
        | boolean
        | {
              success?: boolean;
              error?: boolean;
          };

    // 自定义 toast 消息
    toastMessages?: {
        success?: string | ((data: TOutput) => string);
        error?: string | ((error: Error) => string);
        loading?: string;
    };

    // 是否重置查询参数
    resetQueryOnSuccess?: boolean;

    // 错误重试次数
    retryCount?: number;

    // 错误重试延迟 (ms)
    retryDelay?: number;
}

interface UseServerActionReturn<TInput, TOutput> {
    // 执行函数
    execute: (input: TInput) => Promise<TOutput | undefined>;

    // 状态
    isPending: boolean;
    isExecuting: boolean;
    error: Error | null;
    data: TOutput | null;

    // 工具方法
    reset: () => void;
    clearError: () => void;
}

export function useServerAction<TInput = unknown, TOutput = unknown>({
    action,
    queryKey,
    initialData = null,
    onSuccess,
    onError,
    onExecute,
    onFinally,
    showToast = true,
    toastMessages,
    resetQueryOnSuccess = false,
    retryCount = 0,
    retryDelay = 1000,
}: UseServerActionOptions<TInput, TOutput>): UseServerActionReturn<
    TInput,
    TOutput
> {
    const [isPending, setIsPending] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [data, setData] = useState<TOutput | null>(initialData);

    // 查询参数状态管理
    const queryKeys = Array.isArray(queryKey)
        ? queryKey
        : queryKey
          ? [queryKey]
          : [];
    const queryParsers = createQueryParsers<Record<string, unknown>>(
        queryKeys.reduce<Record<string, QueryParserConfig<unknown>>>(
            (acc, key) => {
                acc[key] = { defaultValue: undefined };
                return acc;
            },
            {},
        ),
    );

    const [_queryStates, setQueryStates] = useQueryStates(queryParsers);

    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setIsPending(false);
        setIsExecuting(false);
    }, [initialData]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const execute = useCallback(
        async (input: TInput): Promise<TOutput | undefined> => {
            let retryAttempts = 0;
            let lastError: Error | null = null;

            const tryExecute = async (): Promise<TOutput | undefined> => {
                try {
                    setIsPending(true);
                    setIsExecuting(true);
                    setError(null);

                    // 触发开始回调
                    onExecute?.(input);

                    // 显示加载 toast
                    const toastConfig =
                        typeof showToast === "object"
                            ? showToast
                            : { success: true, error: true };
                    const showSuccessToast = toastConfig.success !== false;
                    const showErrorToast = toastConfig.error !== false;

                    let loadingToastId: string | number | undefined;
                    if (showSuccessToast || showErrorToast) {
                        const loadingMessage =
                            toastMessages?.loading || "正在处理...";
                        loadingToastId = toast.loading(loadingMessage);
                    }

                    // 执行 Server Action
                    const result = await action(input);

                    // 更新状态
                    setData(result);
                    setError(null);

                    // 成功回调
                    if (onSuccess) {
                        await onSuccess(result, input);
                    }

                    // 成功 toast
                    if (showSuccessToast && loadingToastId !== undefined) {
                        const successMessage = toastMessages?.success
                            ? typeof toastMessages.success === "function"
                                ? toastMessages.success(result)
                                : toastMessages.success
                            : "操作成功";

                        toast.success(successMessage, { id: loadingToastId });
                    }

                    // 重置查询参数
                    if (resetQueryOnSuccess && queryKeys.length > 0) {
                        startTransition(() => {
                            const resetStates: Record<string, null> = {};
                            queryKeys.forEach((key) => {
                                resetStates[key] = null;
                            });
                            setQueryStates(resetStates);
                        });
                    }

                    return result;
                } catch (err) {
                    lastError =
                        err instanceof Error ? err : new Error(String(err));
                    setError(lastError);

                    // 错误回调
                    if (onError) {
                        await onError(lastError, input);
                    }

                    // 错误 toast
                    const toastConfig =
                        typeof showToast === "object"
                            ? showToast
                            : { success: true, error: true };
                    if (toastConfig.error !== false) {
                        const errorMessage = toastMessages?.error
                            ? typeof toastMessages.error === "function"
                                ? toastMessages.error(lastError)
                                : toastMessages.error
                            : lastError.message || "操作失败";

                        toast.error(errorMessage);
                    }

                    throw lastError;
                } finally {
                    setIsPending(false);
                    setIsExecuting(false);
                    onFinally?.();
                }
            };

            // 重试逻辑
            while (retryAttempts <= retryCount) {
                try {
                    return await tryExecute();
                } catch (_err) {
                    retryAttempts++;
                    if (retryAttempts <= retryCount) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay),
                        );
                    }
                }
            }

            // 所有重试都失败了
            return undefined;
        },
        [
            action,
            onExecute,
            onSuccess,
            onError,
            onFinally,
            showToast,
            toastMessages,
            resetQueryOnSuccess,
            retryCount,
            retryDelay,
            queryKeys,
            setQueryStates,
        ],
    );

    return {
        execute,
        isPending,
        isExecuting,
        error,
        data,
        reset,
        clearError,
    };
}

// 简化版本，用于基本的 Server Action
export function useSimpleServerAction<TInput = unknown, TOutput = unknown>(
    action: (input: TInput) => Promise<TOutput>,
    options?: Partial<UseServerActionOptions<TInput, TOutput>>,
) {
    return useServerAction({
        action,
        showToast: true,
        ...options,
    });
}

// 预设的 Server Action Hooks
export const useCreateServerAction = <TInput, TOutput>(
    action: (input: TInput) => Promise<TOutput>,
    options?: Omit<UseServerActionOptions<TInput, TOutput>, "toastMessages">,
) => {
    return useServerAction(action, {
        toastMessages: {
            success: (_data) => "创建成功",
            error: (error) => `创建失败: ${error.message}`,
            loading: "正在创建...",
        },
        ...options,
    });
};

export const useUpdateServerAction = <TInput, TOutput>(
    action: (input: TInput) => Promise<TOutput>,
    options?: Omit<UseServerActionOptions<TInput, TOutput>, "toastMessages">,
) => {
    return useServerAction(action, {
        toastMessages: {
            success: (_data) => "更新成功",
            error: (error) => `更新失败: ${error.message}`,
            loading: "正在更新...",
        },
        ...options,
    });
};

export const useDeleteServerAction = <TInput, TOutput>(
    action: (input: TInput) => Promise<TOutput>,
    options?: Omit<UseServerActionOptions<TInput, TOutput>, "toastMessages">,
) => {
    return useServerAction(action, {
        toastMessages: {
            success: (_data) => "删除成功",
            error: (error) => `删除失败: ${error.message}`,
            loading: "正在删除...",
        },
        ...options,
    });
};

export default useServerAction;
