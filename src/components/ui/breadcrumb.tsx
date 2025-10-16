import { Slot } from "@radix-ui/react-slot";
import { ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type BreadcrumbProps = React.HTMLAttributes<HTMLElement>;

export function Breadcrumb({ className, ...props }: BreadcrumbProps) {
    return (
        <nav
            aria-label="breadcrumb"
            className={cn("w-full", className)}
            {...props}
        />
    );
}

export const BreadcrumbList = React.forwardRef<
    HTMLOListElement,
    React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={cn(
            "inline-flex items-center gap-1 text-muted-foreground",
            className,
        )}
        {...props}
    />
));
BreadcrumbList.displayName = "BreadcrumbList";

export const BreadcrumbItem = React.forwardRef<
    HTMLLIElement,
    React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
    <li
        ref={ref}
        className={cn("inline-flex items-center gap-1", className)}
        {...props}
    />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

export interface BreadcrumbLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    asChild?: boolean;
}

export const BreadcrumbLink = React.forwardRef<
    HTMLAnchorElement,
    BreadcrumbLinkProps
>(({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return (
        <Comp
            ref={ref}
            className={cn(
                "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                className,
            )}
            {...props}
        />
    );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbPage = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        aria-current="page"
        className={cn("inline-flex items-center font-semibold", className)}
        {...props}
    />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

export function BreadcrumbSeparator({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            role="presentation"
            className={cn("inline-flex items-center justify-center", className)}
            {...props}
        >
            <ChevronRightIcon className="h-3 w-3" />
        </span>
    );
}
