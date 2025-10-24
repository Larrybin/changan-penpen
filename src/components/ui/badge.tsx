import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium text-xs w-fit whitespace-nowrap shrink-0 [&>svg]:size-[var(--icon-sm)] gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] [a&]:hover:bg-[var(--primary)]/90 [a&]:hover:shadow-[var(--shadow-md)]",
                secondary:
                    "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-[var(--shadow-sm)] [a&]:hover:bg-[var(--secondary)]/90 [a&]:hover:shadow-[var(--shadow-md)]",
                destructive:
                    "border-transparent bg-[var(--color-danger)] text-[var(--color-danger-foreground)] shadow-[var(--shadow-sm)] [a&]:hover:bg-[var(--color-danger)]/90 [a&]:hover:shadow-[var(--shadow-md)] focus-visible:ring-[var(--color-danger)]/20",
                outline:
                    "text-[var(--foreground)] border-[var(--border)] bg-transparent shadow-[var(--shadow-sm)] [a&]:hover:bg-[var(--accent)] [a&]:hover:text-[var(--accent-foreground)] [a&]:hover:shadow-[var(--shadow-md)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            data-slot="badge"
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
