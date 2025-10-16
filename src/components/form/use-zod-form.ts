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
    type FieldValues,
    type Path,
    type Resolver,
    type UseFormProps,
    type UseFormReturn,
    useForm,
} from "react-hook-form";
import type { z } from "zod";

type ZodFormCompatibleSchema = z.ZodTypeAny & {
    _input: FieldValues;
    _output: FieldValues;
};

type EnsureFieldValues<T> = T extends FieldValues ? T : never;

type SchemaRawInput<TSchema extends z.ZodTypeAny> = z.input<TSchema>;
type SchemaRawOutput<TSchema extends z.ZodTypeAny> = z.output<TSchema>;
type SchemaInput<TSchema extends ZodFormCompatibleSchema> = EnsureFieldValues<
    SchemaRawInput<TSchema>
>;
type SchemaOutput<TSchema extends ZodFormCompatibleSchema> = EnsureFieldValues<
    SchemaRawOutput<TSchema>
>;

export interface UseZodFormOptions<
    TSchema extends ZodFormCompatibleSchema,
    TInput extends FieldValues = SchemaInput<TSchema>,
    TOutput extends FieldValues = SchemaOutput<TSchema>,
> {
    schema: TSchema;
    defaultValues?: UseFormProps<TInput>["defaultValues"];
    onSubmit?: (
        values: TOutput,
        event?: React.BaseSyntheticEvent,
    ) => Promise<void> | void;
    mode?: UseFormProps<TInput>["mode"];
    reValidateMode?: UseFormProps<TInput>["reValidateMode"];
    shouldUnregister?: UseFormProps<TInput>["shouldUnregister"];
    shouldFocusError?: UseFormProps<TInput>["shouldFocusError"];
}

export interface UseZodFormReturn<
    TFieldValues extends FieldValues,
    TTransformedValues extends FieldValues = TFieldValues,
> {
    // React Hook Form 返回值
    form: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
    // 额外的状态和方法
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
    clearMessages: () => void;
    handleSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
    // 便捷方法
    getFieldError: (field: Path<TFieldValues>) => string | undefined;
    setFieldError: (field: Path<TFieldValues>, message: string) => void;
    clearFieldError: (field: Path<TFieldValues>) => void;
}

export function useZodForm<
    TSchema extends ZodFormCompatibleSchema,
    TInput extends FieldValues = SchemaInput<TSchema>,
    TOutput extends FieldValues = SchemaOutput<TSchema>,
>({
    schema,
    defaultValues,
    onSubmit,
    mode = "onTouched",
    reValidateMode = "onChange",
    shouldUnregister = false,
    shouldFocusError = true,
}: UseZodFormOptions<TSchema, TInput, TOutput>): UseZodFormReturn<
    TInput,
    TOutput
> {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // zodResolver preserves the schema's input/output types, but the helper's
    // overloads do not accept our narrowed schema constraint. Coerce once so
    // we can reuse the derived FieldValues types with React Hook Form.
    // biome-ignore lint/suspicious/noExplicitAny: Resolver overloads require the concrete schema type while our generic constraint already restricts inputs/outputs to FieldValues.
    const resolver = zodResolver(schema as any) as unknown as Resolver<
        TInput,
        unknown,
        TOutput
    >;

    const form = useForm<TInput, unknown, TOutput>({
        resolver,
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

    const getFieldError = (field: Path<TInput>) => {
        const { error: fieldError } = form.getFieldState(field);
        return typeof fieldError?.message === "string"
            ? fieldError.message
            : undefined;
    };

    const setFieldError = (field: Path<TInput>, message: string) => {
        form.setError(field, { message });
    };

    const clearFieldError = (field: Path<TInput>) => {
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
export function useSimpleForm<
    TSchema extends ZodFormCompatibleSchema,
    TInput extends FieldValues = SchemaInput<TSchema>,
    TOutput extends FieldValues = SchemaOutput<TSchema>,
>(options: UseZodFormOptions<TSchema, TInput, TOutput>) {
    const { form, handleSubmit, isSubmitting, error, success, clearMessages } =
        useZodForm<TSchema, TInput, TOutput>(options);

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
