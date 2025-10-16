/**
 * FormRadio - 预设的单选框组件
 */

"use client";

import type { ComponentProps } from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import { FormControl } from "./form";

interface FormRadioProps extends ComponentProps<typeof RadioGroup> {
    error?: boolean;
}

export function FormRadio({ error, children, ...props }: FormRadioProps) {
    return (
        <FormControl error={error}>
            <RadioGroup {...props}>{children}</RadioGroup>
        </FormControl>
    );
}

export default FormRadio;
