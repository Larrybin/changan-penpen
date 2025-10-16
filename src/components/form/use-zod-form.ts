/**
 * useZodForm - 简化 Zod schema 集成的表单 Hook
 *
 * 提供统一的表单状态管理、验证和错误处理
 *
 * @example
 * ```tsx
 * const form = useZodForm({
 *   schema: userSchema,
 *   defaultValues: {
 *     name: "",
 *     email: ""
 *   },
 *   onSubmit: async (values) => {
 *     // 提交逻辑
 *   }
 * });
 * ```
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

export interface UseZodFormOptions<T extends z.ZodType> {
    schema: T;
    defaultValues?: z.infer<T>;
    onSubmit?: (
        values: z.infer<T>,
        event?: React.BaseSyntheticEvent,
    ) => Promise<void> | void;
    mode?: UseFormProps["mode"];
    reValidateMode?: UseFormProps["reValidateMode"];
    shouldUnregister?: boolean;
    shouldFocusError?: boolean;
}

export interface UseZodFormReturn<T extends z.ZodType> {
    // React Hook Form 返回值
    form: ReturnType<typeof useForm<z.infer<T>>>;
    // 额外的状态和方法
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
    clearMessages: () => void;
    handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
    // 便捷方法
    getFieldError: (field: keyof z.infer<T>) => string | undefined;
    setFieldError: (field: keyof z.infer<T>, message: string) => void;
    clearFieldError: (field: keyof z.infer<T>) => void;
}

export function useZodForm<T extends z.ZodType>({
    schema,
    defaultValues,
    onSubmit,
    mode = "onTouched",
    reValidateMode = "onChange",
    shouldUnregister = false,
    shouldFocusError = true,
}: UseZodFormOptions<T>): UseZodFormReturn<T> {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const form = useForm<z.infer<T>>({
        resolver: zodResolver(schema),
        defaultValues,
        mode,
        reValidateMode,
        shouldUnregister,
        shouldFocusError,
    });

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (event?: React.BaseSyntheticEvent) => {
        clearMessages();

        try {
            setIsSubmitting(true);

            await form.handleSubmit(async (values) => {
                if (onSubmit) {
                    await onSubmit(values, event);
                }
            })(event);

            setSuccess("提交成功");
        } catch (err) {
            const message = err instanceof Error ? err.message : "提交失败";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getFieldError = (field: keyof z.infer<T>) => {
        const fieldError = form.formState.errors[field as string];
        return typeof fieldError?.message === "string"
            ? fieldError.message
            : undefined;
    };

    const setFieldError = (field: keyof z.infer<T>, message: string) => {
        form.setError(field as string, { message });
    };

    const clearFieldError = (field: keyof z.infer<T>) => {
        form.clearErrors(field as string);
    };

    return {
        form,
        isSubmitting,
        error,
        success,
        clearMessages,
        handleSubmit,
        getFieldError,
        setFieldError,
        clearFieldError,
    };
}

// 简化版本的 Hook，用于只需要基本功能的场景
export function useSimpleForm<T extends z.ZodType>({
    schema,
    defaultValues,
    onSubmit,
}: UseZodFormOptions<T>) {
    const { form, handleSubmit, isSubmitting, error, success, clearMessages } =
        useZodForm({
            schema,
            defaultValues,
            onSubmit,
        });

    return {
        form,
        handleSubmit,
        isSubmitting,
        error,
        success,
        clearMessages,
    };
}

export default useZodForm;
