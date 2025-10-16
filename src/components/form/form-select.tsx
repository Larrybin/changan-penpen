/**
 * FormSelect - 预设的选择框组件
 */

"use client";

import { Select } from "@/components/ui/select";
import { FormControl } from "./form";

interface FormSelectProps extends React.ComponentProps<typeof Select> {
    error?: boolean;
}

export function FormSelect({ error, children, ...props }: FormSelectProps) {
    return (
        <FormControl error={error}>
            <Select {...props}>{children}</Select>
        </FormControl>
    );
}

export default FormSelect;
