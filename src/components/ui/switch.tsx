"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            ref={ref}
            className={cn(
                "peer inline-flex h-[var(--switch-track-height,1.5rem)] w-[var(--switch-track-width,2.75rem)] shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input transition-[background-color,border-color] duration-[var(--token-motion-duration-md)] outline-none focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=unchecked]:bg-input disabled:cursor-not-allowed disabled:opacity-50",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block size-[calc(var(--switch-track-height,1.5rem)-0.375rem)] rounded-full bg-background shadow-xs transition-transform duration-[var(--token-motion-duration-md)] data-[state=checked]:translate-x-[calc(var(--switch-track-width,2.75rem)-var(--switch-track-height,1.5rem))] data-[state=unchecked]:translate-x-0",
                )}
            />
        </SwitchPrimitive.Root>
    );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
