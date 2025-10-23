import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "form-control-base file:text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-[var(--accent)] focus-visible-enhanced color-transition",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
