import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "color-transition",
                "file:bg-transparent",
                "file:border-0",
                "file:font-medium",
                "file:h-7",
                "file:inline-flex",
                "file:text-[var(--foreground)]",
                "file:text-sm",
                "focus-visible-enhanced",
                "form-control-base",
                "hover:border-[var(--accent)]",
                "placeholder:text-[var(--muted-foreground)]",
                "selection:bg-[var(--primary)]",
                "selection:text-[var(--primary-foreground)]",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
