import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "form-control-base placeholder:text-[var(--muted-foreground)] field-sizing-content min-h-16 w-full py-[calc(var(--control-py)+0.25rem)] text-base md:text-sm hover:border-[var(--accent)] focus-visible-enhanced color-transition resize-none",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
