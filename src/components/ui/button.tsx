import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-[var(--button-gap)] whitespace-nowrap rounded-[var(--button-radius)] text-sm font-medium transition-all duration-[var(--button-transition)] active:scale-[var(--button-press-scale)] xs:min-h-[48px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[var(--icon-md)] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive btn-interactive scale-active color-transition",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--button-bg)] text-[var(--button-fg)] shadow-xs hover:bg-[var(--button-hover-bg)]",
                destructive:
                    "bg-[var(--color-danger)] text-[var(--color-danger-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-danger)]/90 focus-visible:ring-[var(--color-danger)]/20",
                outline:
                    "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                secondary:
                    "bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-[var(--shadow-sm)] hover:bg-[var(--secondary)]/80",
                ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                link: "text-[var(--token-link-color)] underline-offset-[var(--token-link-underline-offset)] hover:text-[var(--token-link-hover)] hover:underline",
            },
            size: {
                default:
                    "h-9 px-[var(--button-px)] py-[var(--button-py)] has-[>svg]:px-[calc(var(--button-px)-0.25rem)]",
                sm: "h-8 gap-[var(--button-gap-sm,0.375rem)] px-[var(--button-px-sm,0.75rem)] has-[>svg]:px-[calc(var(--button-px-sm,0.75rem)-0.125rem)]",
                lg: "h-10 px-[var(--button-px-lg,1.5rem)] has-[>svg]:px-[calc(var(--button-px-lg,1.5rem)-0.5rem)]",
                icon: "size-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
