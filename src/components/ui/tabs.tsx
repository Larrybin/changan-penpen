"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            ref={ref}
            className={cn(
                "inline-flex h-10 items-center justify-center gap-[var(--token-spacing-1)] rounded-[var(--token-radius-card)] bg-muted p-1 text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--token-radius-button,var(--radius-md))] px-[var(--token-spacing-4)] py-[var(--token-spacing-2)] text-sm font-medium transition-[background-color,color,box-shadow] focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
                className,
            )}
            {...props}
        />
    );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            ref={ref}
            className={cn(
                "mt-[var(--token-spacing-4)] focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)]",
                className,
            )}
            {...props}
        />
    );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
