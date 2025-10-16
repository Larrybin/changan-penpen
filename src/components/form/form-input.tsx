/**
 * FormInput - 预设的输入框组件
 */

"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "./form";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export function FormInput({ error, className, ...props }: FormInputProps) {
    return (
        <FormControl error={error}>
            <Input
                className={cn(
                    error && "border-destructive focus:border-destructive",
                    className,
                )}
                {...props}
            />
        </FormControl>
    );
}

import { cn } from "@/lib/utils";

export default FormInput;
