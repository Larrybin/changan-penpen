/**
 * FormTextarea - 预设的文本域组件
 */

"use client";

import type { TextareaHTMLAttributes } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FormControl } from "./form";

interface FormTextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

export function FormTextarea({
    error,
    className,
    ...props
}: FormTextareaProps) {
    return (
        <FormControl error={error}>
            <Textarea
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

export default FormTextarea;
