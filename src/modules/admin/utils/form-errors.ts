import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ApiErrorDetails } from "@/lib/api-client";
import { ApiError } from "@/lib/http-error";

function normalizeFieldErrors(details?: ApiErrorDetails) {
    const map = new Map<string, string>();
    if (!details) {
        return map;
    }

    if (details.fieldErrors) {
        for (const [field, message] of Object.entries(details.fieldErrors)) {
            if (typeof message === "string" && message.length > 0) {
                map.set(field, message);
            }
        }
    }

    if (Array.isArray(details.errors)) {
        for (const item of details.errors) {
            if (!item || typeof item !== "object") {
                continue;
            }
            const field = item.field;
            const message = item.message;
            if (typeof field === "string" && typeof message === "string") {
                if (!map.has(field)) {
                    map.set(field, message);
                }
            }
        }
    }

    return map;
}

function extractGeneralMessage(error: ApiError<ApiErrorDetails>) {
    const detailMessage = (() => {
        if (!error.details) {
            return undefined;
        }
        const body = error.details.body as
            | { message?: string }
            | undefined
            | null;
        if (
            body &&
            typeof body === "object" &&
            typeof body.message === "string"
        ) {
            return body.message;
        }
        const statusText = error.details.statusText;
        if (typeof statusText === "string" && statusText.length > 0) {
            return statusText;
        }
        return undefined;
    })();

    return detailMessage ?? error.message;
}

export function applyApiErrorToForm<FormValues extends FieldValues>(
    form: UseFormReturn<FormValues>,
    error: unknown,
    options?: { setRootError?: boolean },
) {
    if (!(error instanceof ApiError)) {
        return false;
    }

    const details = error.details as ApiErrorDetails | undefined;
    const fieldErrors = normalizeFieldErrors(details);

    let applied = false;

    for (const [field, message] of fieldErrors) {
        form.setError(field as Path<FormValues>, {
            type: "server",
            message,
        });
        applied = true;
    }

    if (!applied && options?.setRootError !== false) {
        const rootMessage = extractGeneralMessage(error);
        if (rootMessage) {
            form.setError("root" as Path<FormValues>, {
                type: "server",
                message: rootMessage,
            });
        }
    }

    return applied;
}
