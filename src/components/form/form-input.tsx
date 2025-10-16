/**
 * FormInput - 预设的输入框组件
 */

"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl } from "./form";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ error, className, name, onBlur, onChange, ...props }, ref) => {
        const form = useFormContext();

        const registration = useMemo(() => {
            if (!name) {
                return null;
            }

            try {
                return form.register(name as never);
            } catch {
                return null;
            }
        }, [form, name]);

        const assignRef = (element: HTMLInputElement | null) => {
            if (typeof ref === "function") {
                ref(element);
            } else if (ref) {
                // biome-ignore lint/suspicious/noExplicitAny: forwarding ref generics
                (ref as any).current = element;
            }

            if (registration?.ref) {
                registration.ref(element);
            }
        };

        return (
            <FormControl error={error}>
                <Input
                    className={cn(
                        error && "border-destructive focus:border-destructive",
                        className,
                    )}
                    name={name}
                    onBlur={(event) => {
                        registration?.onBlur?.(event);
                        onBlur?.(event);
                    }}
                    onChange={(event) => {
                        registration?.onChange?.(event);
                        onChange?.(event);
                    }}
                    ref={assignRef}
                    {...props}
                />
            </FormControl>
        );
    },
);

FormInput.displayName = "FormInput";

import { cn } from "@/lib/utils";

export default FormInput;
