import { z } from "zod/v4";

import { ApiError, createApiErrorResponse, isApiError } from "@/lib/http-error";

export default function handleApiError(error: unknown) {
    if (isApiError(error)) {
        return error.toResponse();
    }

    if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        const details = {
            issues: error.issues,
            field: firstError?.path.join(".") ?? null,
        };
        return createApiErrorResponse({
            status: 400,
            code: "INVALID_REQUEST",
            message: firstError?.message ?? "请求参数验证失败",
            details,
            severity: "medium",
        });
    }

    if (error instanceof SyntaxError) {
        return createApiErrorResponse({
            status: 400,
            code: "INVALID_JSON",
            message: "Invalid JSON payload",
            severity: "medium",
        });
    }

    if (error instanceof Error) {
        return new ApiError(error.message, {
            status: 500,
            code: "INTERNAL_ERROR",
            severity: "high",
        }).toResponse();
    }

    return createApiErrorResponse({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        severity: "high",
    });
}
