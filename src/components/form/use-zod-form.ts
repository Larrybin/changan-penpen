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
import {
    type DefaultValues,
    type FieldValues,
    type Path,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm,
} from "react-hook-form";
import type { z } from "zod";

type SchemaFieldValues<TSchema extends z.ZodTypeAny> =
    z.infer<TSchema> extends FieldValues ? z.infer<TSchema> : never;

export interface UseZodFormOptions<TSchema extends z.ZodTypeAny> {
    schema: TSchema;
    defaultValues?: DefaultValues<SchemaFieldValues<TSchema>>;
    onSubmit?: (
        values: SchemaFieldValues<TSchema>,
        event?: React.BaseSyntheticEvent,
    ) => Promise<void> | void;
    mode?: UseFormProps["mode"];
    reValidateMode?: UseFormProps["reValidateMode"];
    shouldUnregister?: boolean;
    shouldFocusError?: boolean;
}

export interface UseZodFormReturn<TSchema extends z.ZodTypeAny> {
    // React Hook Form 返回值
    form: UseFormReturn<
        SchemaFieldValues<TSchema>,
        any,
        SchemaFieldValues<TSchema>
    >;
    // 额外的状态和方法
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
    clearMessages: () => void;
    handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
    // 便捷方法
    getFieldError: (
        field: Path<SchemaFieldValues<TSchema>>,
    ) => string | undefined;
    setFieldError: (
        field: Path<SchemaFieldValues<TSchema>>,
        message: string,
    ) => void;
    clearFieldError: (field: Path<SchemaFieldValues<TSchema>>) => void;
}

export function useZodForm<TSchema extends z.ZodTypeAny>({
    schema,
    defaultValues,
    onSubmit,
    mode = "onTouched",
    reValidateMode = "onChange",
    shouldUnregister = false,
    shouldFocusError = true,
}: UseZodFormOptions<TSchema>): UseZodFormReturn<TSchema> {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    type TFieldValues = SchemaFieldValues<TSchema>;

    const form = useForm<TFieldValues>({
        resolver: zodResolver(schema as unknown as any) as unknown as Resolver<
            TFieldValues,
            any,
            TFieldValues
        >,
        defaultValues: defaultValues as DefaultValues<TFieldValues> | undefined,
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

    const getFieldError = (field: Path<TFieldValues>) => {
        const { error: fieldError } = form.getFieldState(field);
        return typeof fieldError?.message === "string"
            ? fieldError.message
            : undefined;
    };

    const setFieldError = (field: Path<TFieldValues>, message: string) => {
        form.setError(field, { message });
    };

    const clearFieldError = (field: Path<TFieldValues>) => {
        form.clearErrors(field);
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
export function useSimpleForm<TSchema extends z.ZodTypeAny>({
    schema,
    defaultValues,
    onSubmit,
}: UseZodFormOptions<TSchema>) {
    const { form, handleSubmit, isSubmitting, error, success, clearMessages } =
        useZodForm<TSchema>({
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
