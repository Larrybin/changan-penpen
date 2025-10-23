"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Checkbox({
    className,
    ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                "peer form-control-base size-4 shrink-0 rounded-[4px] flex items-center justify-center data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--primary-foreground)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:shadow-[var(--shadow-button)] aria-invalid:ring-[var(--color-danger)]/20 aria-invalid:border-[var(--color-danger)] scale-active color-transition transition-transform duration-[var(--token-motion-duration-fast)] disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                data-slot="checkbox-indicator"
                className="flex items-center justify-center text-current transition-none"
            >
                <CheckIcon className="size-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };