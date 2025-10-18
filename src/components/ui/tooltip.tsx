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
                "z-[var(--z-dropdown)] overflow-hidden rounded-xs bg-foreground/90 px-2.5 py-1.5 text-xs font-medium text-background shadow-xs duration-[var(--token-motion-duration-sm)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                className,
            )}
            {...props}
        />
    );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Arrow>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => {
    return (
        <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            ref={ref}
            className={cn("fill-foreground/90", className)}
            {...props}
        />
    );
});
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

export {
    Tooltip,
    TooltipArrow,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
};
