import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.ComponentPropsWithoutRef<"div"> {
    value?: number;
    max?: number;
}

/**
 * Shadcn style progress component used across the admin dashboard.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, ...props }, ref) => {
        const clamped = Math.min(Math.max(value, 0), max);
        const percentage = max === 0 ? 0 : (clamped / max) * 100;

        return (
            <div
                ref={ref}
                className={cn(
                    "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
                    className,
                )}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={percentage}
                {...props}
            >
                <div
                    className="h-full w-full flex-1 bg-primary transition-all"
                    style={{ transform: `translateX(${percentage - 100}%)` }}
                />
            </div>
        );
    },
);

Progress.displayName = "Progress";
