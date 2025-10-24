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
                "peer form-control-base color-transition flex size-4 shrink-0 scale-active items-center justify-center rounded-[4px] transition-transform duration-[var(--token-motion-duration-fast)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--color-danger)] aria-invalid:ring-[var(--color-danger)]/20 data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--primary-foreground)] data-[state=checked]:shadow-[var(--shadow-button)]",
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
