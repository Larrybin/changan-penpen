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
                "peer focus-visible-enhanced color-transition inline-flex h-[var(--switch-track-height,1.5rem)] w-[var(--switch-track-width,2.75rem)] shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none transition-all duration-[var(--token-motion-duration-md)] disabled:cursor-not-allowed disabled:opacity-50",
                "data-[state=checked]:border-[var(--primary)] data-[state=unchecked]:border-[var(--border)] data-[state=checked]:bg-[var(--primary)] data-[state=unchecked]:bg-[var(--input)]",
                "hover:data-[state=unchecked]:border-[var(--accent)] hover:data-[state=unchecked]:bg-[var(--accent)]",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none block size-[calc(var(--switch-track-height,1.5rem)-0.375rem)] rounded-full bg-[var(--card-foreground)] shadow-[var(--shadow-button)] transition-all duration-[var(--token-motion-duration-emphasized)] ease-[var(--token-motion-ease-back)]",
                    "data-[state=checked]:translate-x-[calc(var(--switch-track-width,2.75rem)-var(--switch-track-height,1.5rem))] data-[state=unchecked]:translate-x-0",
                    "active:scale-90",
                )}
            />
        </SwitchPrimitive.Root>
    );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
