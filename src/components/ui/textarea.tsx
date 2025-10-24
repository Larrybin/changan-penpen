import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "form-control-base field-sizing-content focus-visible-enhanced color-transition min-h-16 w-full resize-none py-[calc(var(--control-py)+0.25rem)] text-base placeholder:text-[var(--muted-foreground)] hover:border-[var(--accent)] md:text-sm",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
