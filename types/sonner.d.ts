import type * as React from "react";

declare module "sonner" {
    export interface ToastOptions {
        id?: string | number;
        description?: React.ReactNode;
        [key: string]: unknown;
    }

    export type ExternalToast = unknown;

    export const Toaster: React.ComponentType<any>;

    export const toast: {
        success(message: string, options?: ToastOptions): unknown;
        error(message: string, options?: ToastOptions): unknown;
        info(message: string, options?: ToastOptions): unknown;
        warning(message: string, options?: ToastOptions): unknown;
        loading(message: string, options?: ToastOptions): string | number | undefined;
        dismiss(id?: string | number): void;
        message: (message: string, options?: ToastOptions) => unknown;
        promise: <T>(promise: Promise<T>, options?: Record<string, ToastOptions>) => Promise<T>;
        custom: (renderer: React.ComponentType<any>, options?: ToastOptions) => unknown;
    };
}
