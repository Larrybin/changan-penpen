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
    initialData?: TOutput | null;

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
            const normalizeToastConfig = () => {
                if (typeof showToast === "object") {
                    return {
                        success: showToast.success !== false,
                        error: showToast.error !== false,
                    };
                }

                if (showToast === false) {
                    return { success: false, error: false };
                }

                return { success: true, error: true };
            };

            const showLoadingToast = (config: {
                success: boolean;
                error: boolean;
            }) => {
                if (!config.success && !config.error) {
                    return undefined;
                }

                const loadingMessage = toastMessages?.loading ?? "正在处理...";
                return toast.loading(loadingMessage);
            };

            const resetQueryStatesIfNeeded = () => {
                if (!resetQueryOnSuccess || queryKeys.length === 0) {
                    return;
                }

                startTransition(() => {
                    const resetStates: Record<string, null> = {};
                    queryKeys.forEach((key) => {
                        resetStates[key] = null;
                    });
                    setQueryStates(resetStates);
                });
            };

            const resolveSuccessMessage = (result: TOutput) => {
                if (!toastMessages?.success) {
                    return "操作成功";
                }

                return typeof toastMessages.success === "function"
                    ? toastMessages.success(result)
                    : toastMessages.success;
            };

            const resolveErrorMessage = (error: Error) => {
                if (!toastMessages?.error) {
                    return error.message || "操作失败";
                }

                return typeof toastMessages.error === "function"
                    ? toastMessages.error(error)
                    : toastMessages.error;
            };

            const maybeShowSuccessToast = (
                config: { success: boolean; error: boolean },
                loadingToastId: string | number | undefined,
                result: TOutput,
            ) => {
                if (!config.success || loadingToastId === undefined) {
                    return;
                }

                toast.success(resolveSuccessMessage(result), {
                    id: loadingToastId,
                });
            };

            const maybeDismissLoadingToast = (
                loadingToastId: string | number | undefined,
            ) => {
                if (loadingToastId === undefined) {
                    return;
                }

                const dismiss = (toast as { dismiss?: typeof toast.dismiss })
                    .dismiss;

                if (typeof dismiss === "function") {
                    dismiss(loadingToastId);
                }
            };

            const maybeShowErrorToast = (
                config: { success: boolean; error: boolean },
                error: Error,
            ) => {
                if (!config.error) {
                    return;
                }

                toast.error(resolveErrorMessage(error));
            };

            const normalizeError = (caughtError: unknown): Error =>
                caughtError instanceof Error
                    ? caughtError
                    : new Error(String(caughtError));

            const handleSuccess = async (
                result: TOutput,
                config: { success: boolean; error: boolean },
                loadingToastId: string | number | undefined,
            ) => {
                setData(result);
                setError(null);

                if (onSuccess) {
                    await onSuccess(result, input);
                }

                maybeShowSuccessToast(config, loadingToastId, result);
                resetQueryStatesIfNeeded();
            };

            const handleError = async (
                caughtError: unknown,
                config: { success: boolean; error: boolean },
                loadingToastId: string | number | undefined,
            ) => {
                const normalizedError = normalizeError(caughtError);

                setError(normalizedError);
                maybeDismissLoadingToast(loadingToastId);

                if (onError) {
                    await onError(normalizedError, input);
                }

                maybeShowErrorToast(config, normalizedError);

                return normalizedError;
            };

            const tryExecute = async (): Promise<TOutput | undefined> => {
                const toastConfig = normalizeToastConfig();
                const loadingToastId = showLoadingToast(toastConfig);

                try {
                    setIsPending(true);
                    setIsExecuting(true);
                    setError(null);
                    onExecute?.(input);

                    const result = await action(input);
                    await handleSuccess(result, toastConfig, loadingToastId);
                    return result;
                } catch (err) {
                    const normalizedError = await handleError(
                        err,
                        toastConfig,
                        loadingToastId,
                    );
                    throw normalizedError;
                } finally {
                    setIsPending(false);
                    setIsExecuting(false);
                    onFinally?.();
                }
            };

            let retryAttempts = 0;

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
    options?: Omit<UseServerActionOptions<TInput, TOutput>, "action">,
) {
    return useServerAction({
        action,
        showToast: true,
        ...options,
    });
}

// 预设的 Server Action Hooks
type CrudActionKind = "create" | "update" | "delete";

const CRUD_TOAST_MESSAGES: Record<
    CrudActionKind,
    {
        success: string | ((data: unknown) => string);
        error: string | ((error: Error) => string);
        loading: string;
    }
> = {
    create: {
        success: "创建成功",
        error: (error) => `创建失败: ${error.message}`,
        loading: "正在创建...",
    },
    update: {
        success: "更新成功",
        error: (error) => `更新失败: ${error.message}`,
        loading: "正在更新...",
    },
    delete: {
        success: "删除成功",
        error: (error) => `删除失败: ${error.message}`,
        loading: "正在删除...",
    },
};

type CrudServerActionOptions<TInput, TOutput> = Omit<
    UseServerActionOptions<TInput, TOutput>,
    "toastMessages" | "action"
> & {
    toastMessages?: UseServerActionOptions<TInput, TOutput>["toastMessages"];
};

export const useCrudServerAction = <TInput, TOutput>(
    kind: CrudActionKind,
    action: (input: TInput) => Promise<TOutput>,
    options?: CrudServerActionOptions<TInput, TOutput>,
) => {
    const { toastMessages: overrideMessages, ...restOptions } = options ?? {};

    const defaultMessages = CRUD_TOAST_MESSAGES[kind];

    const toastMessages = {
        success: overrideMessages?.success ?? defaultMessages.success,
        error: overrideMessages?.error ?? defaultMessages.error,
        loading: overrideMessages?.loading ?? defaultMessages.loading,
    } as UseServerActionOptions<TInput, TOutput>["toastMessages"];

    return useServerAction({
        action,
        toastMessages,
        ...restOptions,
    });
};

export default useServerAction;
