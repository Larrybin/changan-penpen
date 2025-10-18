"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, orientation = "vertical", ...props }, ref) => {
    const layoutClassName =
        orientation === "horizontal"
            ? "flex flex-wrap items-center gap-[var(--token-spacing-4)]"
            : "grid gap-[var(--token-spacing-3)]";

    return (
        <RadioGroupPrimitive.Root
            data-slot="radio-group"
            ref={ref}
            orientation={orientation}
            className={cn(layoutClassName, className)}
            {...props}
        />
    );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioGroupItemProps = React.ComponentPropsWithoutRef<
    typeof RadioGroupPrimitive.Item
> & {
    label?: React.ReactNode;
};

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    RadioGroupItemProps
>(({ className, children, label, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const itemId = id ?? generatedId;
    const labelContent = children ?? label;
    const isDisabled = Boolean(disabled);

    return (
        <div
            data-slot="radio-group-item-wrapper"
            className={cn(
                "inline-flex items-center gap-[var(--token-spacing-2)]",
                isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
        >
            <RadioGroupPrimitive.Item
                data-slot="radio-group-item"
                ref={ref}
                id={itemId}
                disabled={disabled}
                className={cn(
                    "border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] size-4 rounded-full border-2 shadow-xs transition-[border-color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            >
                <RadioGroupPrimitive.Indicator
                    data-slot="radio-group-indicator"
                    className="flex size-full items-center justify-center"
                >
                    <span className="size-2.5 rounded-full bg-primary" />
                </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            {labelContent && (
                <label
                    data-slot="radio-group-label"
                    htmlFor={itemId}
                    className={cn(
                        "text-sm text-foreground",
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer",
                    )}
                >
                    {labelContent}
                </label>
            )}
        </div>
    );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
