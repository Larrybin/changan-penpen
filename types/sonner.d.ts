import type * as React from "react";

declare module "sonner" {
    type Title = React.ReactNode;

    export interface ToastAction {
        label: React.ReactNode;
        onClick: (
            event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        ) => void;
    }

    export interface ToastOptions {
        duration?: number;
        icon?: React.ReactNode;
        className?: string;
        closeButton?: boolean;
        dismissible?: boolean;
        action?: ToastAction | React.ReactNode;
        cancel?: ToastAction | React.ReactNode;
        [key: string]: unknown;
    }

    export interface ExternalToast extends ToastOptions {
        id?: string | number;
        description?: React.ReactNode;
        toasterId?: string;
    }

    export interface ToasterProps {
        className?: string;
        position?:
            | "top-left"
            | "top-right"
            | "bottom-left"
            | "bottom-right"
            | "top-center"
            | "bottom-center";
        expand?: boolean;
        richColors?: boolean;
        closeButton?: boolean;
        theme?: "light" | "dark" | "system" | string;
        toastOptions?: ExternalToast;
        dir?: "ltr" | "rtl" | "auto";
        offset?: number | string | Record<string, number | string>;
        [key: string]: unknown;
    }

    export const Toaster: React.ComponentType<ToasterProps>;

    export type ToastInvoker = (
        message: Title,
        options?: ExternalToast,
    ) => string | number;

    export type ToastAPI = ToastInvoker & {
        success(message: Title, options?: ExternalToast): string | number;
        error(message: Title, options?: ExternalToast): string | number;
        info(message: Title, options?: ExternalToast): string | number;
        warning(message: Title, options?: ExternalToast): string | number;
        loading(message: Title, options?: ExternalToast): string | number;
        message: ToastInvoker;
        dismiss(id?: string | number): void;
        promise<T>(
            promise: Promise<T>,
            options?: {
                loading?: Title;
                success?: Title | ((value: T) => Title | Promise<Title>);
                error?: Title | ((error: unknown) => Title | Promise<Title>);
                finally?: () => void | Promise<void>;
            },
        ): Promise<T>;
        custom(
            renderer: (id: string | number) => React.ReactElement,
            options?: ExternalToast,
        ): string | number;
    };

    export const toast: ToastAPI;
}
