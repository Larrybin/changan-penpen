import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "form-control-base focus-visible-enhanced color-transition selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-[var(--foreground)] file:text-sm placeholder:text-[var(--muted-foreground)] hover:border-[var(--accent)]",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
