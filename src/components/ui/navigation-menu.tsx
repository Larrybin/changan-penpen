"use client";

import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
        ref={ref}
        data-slot="navigation-menu"
        className={cn(
            "relative z-[var(--z-dropdown)] flex max-w-max flex-1 justify-center",
            className,
        )}
        {...props}
    />
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List
        ref={ref}
        data-slot="navigation-menu-list"
        className={cn(
            "group flex flex-1 list-none items-center justify-center gap-[var(--token-spacing-1)]",
            className,
        )}
        {...props}
    />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

function NavigationMenuItem({
    className,
    ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
    return (
        <NavigationMenuPrimitive.Item
            data-slot="navigation-menu-item"
            className={className}
            {...props}
        />
    );
}

const navigationMenuTriggerClasses =
    "group inline-flex h-10 w-max items-center gap-[var(--token-spacing-2)] justify-center rounded-[var(--button-radius)] px-[var(--button-px)] py-[var(--button-py)] text-sm font-medium transition-[color,background] duration-[var(--token-motion-duration-md)] focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground";

const NavigationMenuTrigger = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Trigger
        ref={ref}
        data-slot="navigation-menu-trigger"
        className={cn(
            "bg-transparent",
            navigationMenuTriggerClasses,
            className,
        )}
        {...props}
    >
        {children}
        <ChevronDownIcon
            aria-hidden
            className="size-4 transition-transform duration-[var(--token-motion-duration-sm)] group-data-[state=open]:rotate-180"
        />
    </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuLink = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Link>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Link
        ref={ref}
        data-slot="navigation-menu-link"
        className={cn(
            navigationMenuTriggerClasses,
            "bg-transparent",
            className,
        )}
        {...props}
    />
));
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

const NavigationMenuContent = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Content
        ref={ref}
        data-slot="navigation-menu-content"
        className={cn(
            "left-0 top-0 w-full origin-[var(--radix-navigation-menu-content-transform-origin)] rounded-[var(--token-radius-card)] border bg-popover p-[var(--token-spacing-6)] text-popover-foreground shadow-lg duration-[var(--token-motion-duration-md)] data-[motion=from-start]:animate-in data-[motion=from-end]:animate-in data-[state=closed]:animate-out data-[motion=from-start]:fade-in-0 data-[motion=from-start]:slide-in-from-left-4 data-[motion=from-end]:fade-in-0 data-[motion=from-end]:slide-in-from-right-4 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
        )}
        {...props}
    />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuViewport = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
    <div className="absolute left-1/2 top-full flex w-full -translate-x-1/2 justify-center">
        <NavigationMenuPrimitive.Viewport
            ref={ref}
            data-slot="navigation-menu-viewport"
            className={cn(
                "relative z-[var(--z-dropdown)] h-[var(--radix-navigation-menu-viewport-height)] w-full min-w-[var(--radix-navigation-menu-viewport-width)] overflow-hidden rounded-[var(--token-radius-card)] border bg-popover shadow-lg transition-[width,height] duration-[var(--token-motion-duration-md)] data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-95",
                className,
            )}
            {...props}
        />
    </div>
));
NavigationMenuViewport.displayName =
    NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Indicator
        ref={ref}
        data-slot="navigation-menu-indicator"
        className={cn(
            "top-full z-[var(--z-dropdown)] flex h-1.5 items-end justify-center overflow-hidden transition-[width,transform] duration-[var(--token-motion-duration-sm)] ease-out data-[state=visible]:animate-in data-[state=visible]:fade-in-0 data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0",
            className,
        )}
        {...props}
    >
        <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-[var(--token-radius-xs,2px)] bg-border shadow-sm" />
    </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
    NavigationMenuPrimitive.Indicator.displayName;

function NavigationMenuSub({
    ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Sub>) {
    return (
        <NavigationMenuPrimitive.Sub
            data-slot="navigation-menu-sub"
            {...props}
        />
    );
}

export {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuSub,
    NavigationMenuTrigger,
    NavigationMenuViewport,
};
