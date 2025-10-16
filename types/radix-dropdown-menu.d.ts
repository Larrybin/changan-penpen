import type * as React from "react";

type DropdownMenuBaseProps = React.HTMLAttributes<HTMLElement> & {
    children?: React.ReactNode;
    asChild?: boolean;
};

type DropdownMenuComponent<P = DropdownMenuBaseProps> =
    React.ForwardRefExoticComponent<
        React.PropsWithoutRef<P> & React.RefAttributes<unknown>
    >;

declare module "@radix-ui/react-dropdown-menu" {
    export const Root: DropdownMenuComponent;
    export const Trigger: DropdownMenuComponent;
    export const Group: DropdownMenuComponent;
    export const Portal: DropdownMenuComponent;
    export const Sub: DropdownMenuComponent;
    export const RadioGroup: DropdownMenuComponent;
    export const SubTrigger: DropdownMenuComponent<
        DropdownMenuBaseProps & { inset?: boolean }
    >;
    export const SubContent: DropdownMenuComponent;
    export const Content: DropdownMenuComponent<
        DropdownMenuBaseProps & {
            sideOffset?: number;
            align?: "start" | "center" | "end" | "left" | "right";
        }
    >;
    export const Item: DropdownMenuComponent;
    export const CheckboxItem: DropdownMenuComponent<
        DropdownMenuBaseProps & {
            checked?: boolean | "indeterminate";
            onCheckedChange?: (checked: boolean | "indeterminate") => void;
        }
    >;
    export const ItemIndicator: DropdownMenuComponent;
    export const RadioItem: DropdownMenuComponent;
    export const Label: DropdownMenuComponent<
        DropdownMenuBaseProps & { inset?: boolean }
    >;
    export const Separator: DropdownMenuComponent;
}
