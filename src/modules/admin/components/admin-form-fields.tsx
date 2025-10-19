"use client";

import type {
    InputHTMLAttributes,
    ReactNode,
    TextareaHTMLAttributes,
} from "react";
import type {
    FieldValues,
    Path,
    RegisterOptions,
    UseFormReturn,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BaseFieldProps<TFieldValues extends FieldValues> {
    form: UseFormReturn<TFieldValues>;
    name: Path<TFieldValues>;
    label: ReactNode;
    description?: ReactNode;
    containerClassName?: string;
    registerOptions?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
    id?: string;
}

export type AdminTextFieldProps<TFieldValues extends FieldValues> =
    BaseFieldProps<TFieldValues> &
        Omit<
            InputHTMLAttributes<HTMLInputElement>,
            "name" | "defaultValue" | "value" | "form"
        >;

export function AdminTextField<TFieldValues extends FieldValues>({
    form,
    name,
    label,
    description,
    containerClassName,
    registerOptions,
    id,
    className,
    ...inputProps
}: AdminTextFieldProps<TFieldValues>) {
    const fieldId = id ?? String(name);
    const registration = form.register(name, registerOptions);

    return (
        <div className={cn("grid gap-2", containerClassName)}>
            <label className="text-sm font-medium" htmlFor={fieldId}>
                {label}
            </label>
            <Input
                id={fieldId}
                {...registration}
                {...inputProps}
                className={className}
            />
            {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
        </div>
    );
}

export type AdminTextareaFieldProps<TFieldValues extends FieldValues> =
    BaseFieldProps<TFieldValues> &
        Omit<
            TextareaHTMLAttributes<HTMLTextAreaElement>,
            "name" | "defaultValue" | "value" | "form"
        >;

export function AdminTextareaField<TFieldValues extends FieldValues>({
    form,
    name,
    label,
    description,
    containerClassName,
    registerOptions,
    id,
    className,
    ...textareaProps
}: AdminTextareaFieldProps<TFieldValues>) {
    const fieldId = id ?? String(name);
    const registration = form.register(name, registerOptions);

    return (
        <div className={cn("grid gap-2", containerClassName)}>
            <label className="text-sm font-medium" htmlFor={fieldId}>
                {label}
            </label>
            <Textarea
                id={fieldId}
                {...registration}
                {...textareaProps}
                className={className}
            />
            {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
        </div>
    );
}

export type AdminDateTimeFieldProps<TFieldValues extends FieldValues> =
    AdminTextFieldProps<TFieldValues> & {
        type?: "datetime-local" | "date" | "time";
    };

export function AdminDateTimeField<TFieldValues extends FieldValues>({
    type = "datetime-local",
    ...props
}: AdminDateTimeFieldProps<TFieldValues>) {
    return <AdminTextField<TFieldValues> {...props} type={type} />;
}
