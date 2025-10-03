import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-[var(--button-gap)] whitespace-nowrap rounded-[var(--button-radius)] text-sm font-medium transition-all duration-[var(--button-transition)] active:scale-[var(--button-press-scale)] xs:min-h-[48px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[var(--icon-md)] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--button-bg)] text-[var(--button-fg)] shadow-xs hover:bg-[var(--button-hover-bg)]",
                destructive:
                    "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
                outline:
                    "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
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
