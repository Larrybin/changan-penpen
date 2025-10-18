"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function Accordion({
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            ref={ref}
            className={cn("border-b border-border last:border-b-0", className)}
            {...props}
        />
    );
});
AccordionItem.displayName = AccordionPrimitive.Item.displayName;

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Header
            data-slot="accordion-header"
            className="flex"
        >
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                ref={ref}
                className={cn(
                    "flex flex-1 items-center justify-between gap-[var(--token-spacing-3)] py-[var(--token-spacing-3)] text-left text-sm font-medium transition-[color,transform] focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] [&>svg]:size-4 [&>svg]:shrink-0 data-[state=open]:text-foreground data-[state=closed]:text-muted-foreground",
                    className,
                )}
                {...props}
            >
                {children}
                <ChevronDownIcon className="transition-transform duration-[var(--token-motion-duration-md)] data-[state=open]:rotate-180" />
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            ref={ref}
            className={cn(
                "grid overflow-hidden text-sm transition-[grid-template-rows,opacity] duration-[var(--token-motion-duration-md)] data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
                className,
            )}
            {...props}
        >
            <div className="pb-[var(--token-spacing-4)] pt-[var(--token-spacing-1)]">
                {children}
            </div>
        </AccordionPrimitive.Content>
    );
});
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
