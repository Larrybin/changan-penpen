"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            delayDuration={props.delayDuration ?? 200}
            skipDelayDuration={props.skipDelayDuration ?? 150}
            {...props}
        />
    );
}

function Tooltip({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => {
    return (
        <TooltipPrimitive.Content
            data-slot="tooltip-content"
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "fade-in color-transition z-[var(--z-tooltip)] overflow-hidden rounded-xs bg-[var(--popover)] px-2.5 py-1.5 font-medium text-[var(--popover-foreground)] text-xs shadow-[var(--shadow-dropdown)]",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in",
                className,
            )}
            {...props}
        />
    );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
