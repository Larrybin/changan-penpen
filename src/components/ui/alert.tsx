import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
    "w-full rounded-md border p-4 text-sm shadow-[var(--shadow-sm)] fade-in color-transition focus-visible-enhanced",
    {
        variants: {
            variant: {
                info: "bg-[var(--color-info-subtle)] text-[var(--color-info-foreground)] border-[var(--color-info-border)]",
                success:
                    "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)] border-[var(--color-success-border)]",
                warning:
                    "bg-[var(--color-warning-subtle)] text-[var(--color-warning-foreground)] border-[var(--color-warning-border)]",
                danger: "bg-[var(--color-danger-subtle)] text-[var(--color-danger-foreground)] border-[var(--color-danger-border)]",
                muted: "bg-muted text-muted-foreground border-border",
            },
        },
        defaultVariants: {
            variant: "info",
        },
    },
);

function Alert({
    className,
    variant,
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
    return (
        /* biome-ignore lint/a11y/useSemanticElements: Using a div with role="status" ensures compatibility with existing styles and screen readers. */
        <div
            data-slot="alert"
            role="status"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-title"
            className={cn("mb-1 font-semibold", className)}
            {...props}
        />
    );
}

function AlertDescription({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-description"
            className={cn("text-sm leading-relaxed", className)}
            {...props}
        />
    );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
