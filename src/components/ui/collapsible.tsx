"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as React from "react";

import { cn } from "@/lib/utils";

function Collapsible({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
    return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
    ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
    return (
        <CollapsiblePrimitive.Trigger
            data-slot="collapsible-trigger"
            {...props}
        />
    );
}

const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => {
    return (
        <CollapsiblePrimitive.Content
            data-slot="collapsible-content"
            ref={ref}
            className={cn(
                "grid overflow-hidden transition-[grid-template-rows,opacity] duration-[var(--token-motion-duration-md)] data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
                className,
            )}
            {...props}
        >
            <div className="min-h-0">{children}</div>
        </CollapsiblePrimitive.Content>
    );
});
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
