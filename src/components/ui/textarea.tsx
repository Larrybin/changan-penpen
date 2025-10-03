import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[var(--token-focus-ring-color)] aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-[var(--control-radius)] border bg-transparent px-[var(--control-px)] py-[calc(var(--control-py)+0.25rem)] text-base shadow-xs transition-[color,box-shadow] duration-[var(--token-motion-duration-md)] outline-none focus-visible:ring-[var(--token-focus-ring-width)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
