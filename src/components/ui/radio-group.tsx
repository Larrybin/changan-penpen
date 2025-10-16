"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
    name: string;
    value?: string;
    disabled?: boolean;
    onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
    null,
);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    defaultValue?: string;
    name?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    orientation?: "vertical" | "horizontal";
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
    (
        {
            value,
            defaultValue,
            name,
            onValueChange,
            disabled,
            children,
            className,
            orientation = "vertical",
            ...props
        },
        ref,
    ) => {
        const generatedName = React.useId();
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = React.useState(defaultValue);

        React.useEffect(() => {
            if (!isControlled && defaultValue !== undefined) {
                setInternalValue(defaultValue);
            }
        }, [defaultValue, isControlled]);

        const currentValue = isControlled ? value : internalValue;

        const handleValueChange = React.useCallback(
            (nextValue: string) => {
                if (!isControlled) {
                    setInternalValue(nextValue);
                }
                onValueChange?.(nextValue);
            },
            [isControlled, onValueChange],
        );

        const contextValue = React.useMemo(
            () => ({
                name: name ?? generatedName,
                value: currentValue,
                disabled,
                onValueChange: handleValueChange,
            }),
            [name, generatedName, currentValue, disabled, handleValueChange],
        );

        return (
            <RadioGroupContext.Provider value={contextValue}>
                <div
                    ref={ref}
                    role="radiogroup"
                    aria-disabled={disabled}
                    className={cn(
                        "flex gap-2",
                        orientation === "vertical" ? "flex-col" : "flex-row",
                        className,
                    )}
                    {...props}
                >
                    {children}
                </div>
            </RadioGroupContext.Provider>
        );
    },
);
RadioGroup.displayName = "RadioGroup";

export interface RadioGroupItemProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: React.ReactNode;
}

export const RadioGroupItem = React.forwardRef<
    HTMLInputElement,
    RadioGroupItemProps
>(({ label, children, className, disabled, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);

    if (!context) {
        throw new Error(
            "RadioGroupItem must be used within a RadioGroup component",
        );
    }

    const normalizedValue =
        typeof value === "number" ? String(value) : (value ?? "");
    const isChecked =
        normalizedValue !== "" && context.value === normalizedValue;
    const isDisabled = disabled ?? context.disabled;

    const { onChange, ...restProps } = props;

    return (
        <label
            className={cn(
                "inline-flex items-center gap-2",
                isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                className,
            )}
        >
            <input
                ref={ref}
                type="radio"
                name={context.name}
                checked={isChecked}
                disabled={isDisabled}
                onChange={(event) => {
                    onChange?.(event);
                    if (!event.defaultPrevented && event.target.value) {
                        context.onValueChange(event.target.value);
                    }
                }}
                value={normalizedValue}
                {...restProps}
            />
            {children ?? label}
        </label>
    );
});
RadioGroupItem.displayName = "RadioGroupItem";

export default RadioGroup;
