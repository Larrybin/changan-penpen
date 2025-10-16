/**
 * Form - 支持i18n的统一表单组件
 *
 * 基于 React Hook Form 和 Zod 的表单封装，支持国际化错误提示
 *
 * @example
 * ```tsx
 * const form = useZodForm({ schema, defaultValues });
 *
 * <Form {...form}>
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <FormField name="email" control={form.control}>
 *       <FormItem>
 *         <FormLabel>Email</FormLabel>
 *         <FormControl>
 *           <Input />
 *         </FormControl>
 *         <FormMessage />
 *       </FormItem>
 *     </FormField>
 *   </form>
 * </Form>
 * ```
 */

"use client";

import type { FieldPath, FieldValues } from "react-hook-form";
import {
    Controller,
    FormProvider,
    type ControllerProps,
    type ControllerRenderProps,
    type FieldError,
    type UseFormReturn,
    useFormContext,
} from "react-hook-form";
import { cn } from "@/lib/utils";

type FormComponentProps<T extends FieldValues = FieldValues> =
    UseFormReturn<T, unknown> & {
        children?: React.ReactNode;
        className?: string;
    };

export function Form<T extends FieldValues = FieldValues>({
    children,
    className,
    ...form
}: FormComponentProps<T>) {
    return (
        <FormProvider {...form}>
            {className ? (
                <div className={cn("space-y-6", className)}>{children}</div>
            ) : (
                children
            )}
        </FormProvider>
    );
}

// FormItem - 表单项容器
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function FormItem({ className, ...props }: FormItemProps) {
    return <div className={cn("space-y-2", className)} {...props} />;
}

// FormLabel - 标签组件
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export function FormLabel({
    className,
    required,
    children,
    ...props
}: FormLabelProps) {
    return (
        <label
            className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className,
            )}
            {...props}
        >
            {children}
            {required && <span className="text-destructive ml-1">*</span>}
        </label>
    );
}

// FormControl - 表单控件容器
interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
    error?: boolean;
}

export function FormControl({ className, error, ...props }: FormControlProps) {
    return (
        <div
            className={cn("relative", error && "text-destructive", className)}
            {...props}
        />
    );
}

// FormDescription - 描述文本
interface FormDescriptionProps
    extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormDescription({ className, ...props }: FormDescriptionProps) {
    return (
        <p
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}

// FormMessage - 错误或成功消息
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    field?: string;
}

export function FormMessage({
    className,
    field,
    children,
    ...props
}: FormMessageProps) {
    const { formState } = useFormContext();
    const error = field ? formState.errors[field] : null;

    if (!children && !error) {
        return null;
    }

    const message =
        children || (typeof error?.message === "string" ? error.message : "");

    if (!message) {
        return null;
    }

    return (
        <p
            className={cn(
                "text-sm",
                error ? "text-destructive" : "text-green-600",
                className,
            )}
            {...props}
        >
            {message}
        </p>
    );
}

// FormField - 高级表单字段组件
import {
    Controller,
    type ControllerProps,
    type ControllerRenderProps,
    type FieldError,
} from "react-hook-form";

interface FormFieldProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, "render"> {
    children: (
        field: ControllerRenderProps<TFieldValues, TName> & {
            error?: FieldError;
        },
    ) => React.ReactNode;
}

export function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, children, ...props }: FormFieldProps<TFieldValues, TName>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem>
                    {children({
                        ...field,
                        error: fieldState.error,
                    })}
                    {fieldState.error && <FormMessage field={name} />}
                </FormItem>
            )}
            {...props}
        />
    );
}

// FormSubmit - 提交按钮
interface FormSubmitProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isSubmitting?: boolean;
    isValid?: boolean;
    isDirty?: boolean;
}

export function FormSubmit({
    children,
    isSubmitting,
    isValid,
    isDirty,
    className,
    disabled,
    ...props
}: FormSubmitProps) {
    const isDisabled =
        disabled || isSubmitting || (isValid === false && !isDirty);

    return (
        <button
            type="submit"
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4",
                className,
            )}
            disabled={isDisabled}
            {...props}
        >
            {isSubmitting && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {children}
        </button>
    );
}

// FormError - 全局表单错误
interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
    error?: string | null;
}

export function FormError({ error, className, ...props }: FormErrorProps) {
    if (!error) return null;

    return (
        <div
            className={cn(
                "rounded-md bg-destructive/15 p-3 text-sm text-destructive",
                className,
            )}
            {...props}
        >
            {error}
        </div>
    );
}

// FormSuccess - 成功消息
interface FormSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
    success?: string | null;
}

export function FormSuccess({
    success,
    className,
    ...props
}: FormSuccessProps) {
    if (!success) return null;

    return (
        <div
            className={cn(
                "rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200",
                className,
            )}
            {...props}
        >
            {success}
        </div>
    );
}

export default Form;


