"use client";

import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Menubar = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Root
        ref={ref}
        data-slot="menubar"
        className={cn(
            "flex h-10 items-center gap-[var(--token-spacing-1)] rounded-[var(--token-radius-card)] border bg-background p-[var(--token-spacing-1)] shadow-sm",
            className,
        )}
        {...props}
    />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

function MenubarMenu({
    ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
    return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}

const MenubarTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Trigger
        ref={ref}
        data-slot="menubar-trigger"
        className={cn(
            "inline-flex h-8 min-w-[2.5rem] items-center justify-center gap-[var(--token-spacing-2)] rounded-[var(--button-radius)] px-[var(--button-px-sm,0.75rem)] py-[var(--token-spacing-1)] text-sm font-medium transition-[color,background] duration-[var(--token-motion-duration-md)] focus-visible:outline-hidden focus-visible:ring-[var(--token-focus-ring-color)] focus-visible:ring-[var(--token-focus-ring-width)] focus-visible:ring-offset-[var(--token-focus-ring-offset)] data-[state=open]:bg-accent/70 data-[state=open]:text-accent-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
            className,
        )}
        {...props}
    />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
    <MenubarPrimitive.SubTrigger
        ref={ref}
        data-slot="menubar-sub-trigger"
        className={cn(
            "flex cursor-default select-none items-center gap-[var(--token-spacing-2)] rounded-[var(--token-radius-md,0.5rem)] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)] text-sm outline-none focus-visible:bg-accent focus-visible:text-accent-foreground data-[state=open]:bg-accent/70 data-[state=open]:text-accent-foreground",
            className,
        )}
        {...props}
    >
        {children}
        <ChevronRightIcon className="ml-auto size-4" />
    </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.SubContent
        ref={ref}
        data-slot="menubar-sub-content"
        className={cn(
            "min-w-[12rem] rounded-[var(--token-radius-card)] border bg-popover p-1 text-popover-foreground shadow-lg",
            className,
        )}
        {...props}
    />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => (
    <MenubarPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        data-slot="menubar-content"
        className={cn(
            "z-[var(--z-dropdown)] min-w-[12rem] overflow-hidden rounded-[var(--token-radius-card)] border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
        )}
        {...props}
    />
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Item
        ref={ref}
        data-slot="menubar-item"
        className={cn(
            "relative flex cursor-default select-none items-center gap-[var(--token-spacing-2)] rounded-[var(--token-radius-md,0.5rem)] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)] text-sm outline-none focus-visible:bg-accent focus-visible:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        {...props}
    />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
    <MenubarPrimitive.CheckboxItem
        ref={ref}
        data-slot="menubar-checkbox-item"
        className={cn(
            "relative flex cursor-default select-none items-center gap-[var(--token-spacing-2)] rounded-[var(--token-radius-md,0.5rem)] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)] text-sm outline-none focus-visible:bg-accent focus-visible:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-[var(--token-spacing-2)] inline-flex size-4 items-center justify-center">
            <MenubarPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioGroup = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.RadioGroup>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioGroup>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.RadioGroup
        ref={ref}
        data-slot="menubar-radio-group"
        className={cn("grid gap-[var(--token-spacing-1)]", className)}
        {...props}
    />
));
MenubarRadioGroup.displayName = MenubarPrimitive.RadioGroup.displayName;

const MenubarRadioItem = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
    <MenubarPrimitive.RadioItem
        ref={ref}
        data-slot="menubar-radio-item"
        className={cn(
            "relative flex cursor-default select-none items-center gap-[var(--token-spacing-2)] rounded-[var(--token-radius-md,0.5rem)] px-[var(--token-spacing-3)] py-[var(--token-spacing-2)] text-sm outline-none focus-visible:bg-accent focus-visible:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        {...props}
    >
        <span className="absolute left-[var(--token-spacing-2)] inline-flex size-4 items-center justify-center">
            <MenubarPrimitive.ItemIndicator>
                <CircleIcon className="size-2.5 fill-current" />
            </MenubarPrimitive.ItemIndicator>
        </span>
        {children}
    </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarLabel = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
        inset?: boolean;
    }
>(({ className, inset = false, ...props }, ref) => (
    <MenubarPrimitive.Label
        ref={ref}
        data-slot="menubar-label"
        className={cn(
            "px-[var(--token-spacing-3)] py-[var(--token-spacing-2)] text-xs font-semibold uppercase tracking-wide text-muted-foreground",
            inset && "pl-[calc(var(--token-spacing-3)*2)]",
            className,
        )}
        {...props}
    />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarSeparator = React.forwardRef<
    React.ElementRef<typeof MenubarPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <MenubarPrimitive.Separator
        ref={ref}
        data-slot="menubar-separator"
        className={cn("-mx-1 my-1 h-px bg-border", className)}
        {...props}
    />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        data-slot="menubar-shortcut"
        className={cn(
            "ml-auto text-xs uppercase tracking-[0.2em] text-muted-foreground",
            className,
        )}
        {...props}
    />
));
MenubarShortcut.displayName = "MenubarShortcut";

const MenubarPortal = MenubarPrimitive.Portal;
const MenubarGroup = MenubarPrimitive.Group;
const MenubarSub = MenubarPrimitive.Sub;

export {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarPortal,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
};
