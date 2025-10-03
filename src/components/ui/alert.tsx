import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
    "w-full rounded-md border p-4 text-sm",
    {
        variants: {
            variant: {
                info: "bg-[var(--color-info-subtle)] text-[var(--color-info-foreground)] border-[var(--color-info-border)]",
                success:
                    "bg-[var(--color-success-subtle)] text-[var(--color-success-foreground)] border-[var(--color-success-border)]",
                warning:
                    "bg-[var(--color-warning-subtle)] text-[var(--color-warning-foreground)] border-[var(--color-warning-border)]",
                danger:
                    "bg-[var(--color-danger-subtle)] text-red-700 border-[var(--color-danger-border)]",
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
            className={cn("font-semibold mb-1", className)}
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

