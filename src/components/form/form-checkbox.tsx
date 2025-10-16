/**
 * FormCheckbox - 预设的复选框组件
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl } from "./form";

interface FormCheckboxProps extends React.ComponentProps<typeof Checkbox> {
    error?: boolean;
}

export function FormCheckbox({ error, ...props }: FormCheckboxProps) {
    return (
        <FormControl error={error}>
            <Checkbox {...props} />
        </FormControl>
    );
}

export default FormCheckbox;
