"use client";

import { Toast } from "@/components/ui/toast";
import type { NotificationProvider } from "@/lib/crud/types";
import { toast } from "@/lib/toast";

export const notificationProvider: NotificationProvider = {
    open: ({ message, description, type, key }) => {
        const toastId = key?.toString();
        const baseMessage = typeof message === "string" ? message : "";
        const content = description
            ? `${baseMessage}\n${description}`
            : baseMessage;

        switch (type) {
            case "success":
                toast.success(content, { id: toastId });
                break;
            case "error":
                toast.error(content, { id: toastId });
                break;
            default:
                toast(content, { id: toastId });
                break;
        }
    },
    close: (key) => {
        toast.dismiss(key?.toString());
    },
};

export function AdminToaster() {
    return <Toast />;
}
