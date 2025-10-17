"use client";

import {
    MutationCache,
    QueryCache,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-hot-toast";
import type { ApiErrorDetails as ApiClientErrorDetails } from "@/lib/api-client";
import { ApiError } from "@/lib/http-error";

function extractRetryAfter(details: unknown) {
    const record = details as ApiClientErrorDetails | undefined;
    if (!record || typeof record !== "object") {
        return undefined;
    }
    const retryAfter = record.retryAfterSeconds;
    return typeof retryAfter === "number" && Number.isFinite(retryAfter)
        ? retryAfter
        : undefined;
}

function extractRateLimit(details: unknown) {
    const record = details as ApiClientErrorDetails | undefined;
    if (!record || typeof record !== "object") {
        return undefined;
    }
    if (!record.rateLimit || typeof record.rateLimit !== "object") {
        return undefined;
    }
    const { limit, remaining, reset } = record.rateLimit;
    return {
        limit: typeof limit === "number" ? limit : undefined,
        remaining: typeof remaining === "number" ? remaining : undefined,
        reset: typeof reset === "number" ? reset : undefined,
    };
}

function notifyError(error: unknown) {
    if (typeof window === "undefined") {
        return;
    }

    if (error instanceof ApiError) {
        const retryAfter = extractRetryAfter(error.details);
        const rateLimit = extractRateLimit(error.details);
        const descriptionParts: string[] = [];
        if (error.status === 429 && retryAfter) {
            descriptionParts.push(`请在 ${retryAfter} 秒后再试。`);
        }
        if (
            error.status === 429 &&
            rateLimit?.remaining === 0 &&
            rateLimit.reset
        ) {
            const resetSeconds = Math.max(
                rateLimit.reset - Math.floor(Date.now() / 1000),
                0,
            );
            if (resetSeconds > 0) {
                descriptionParts.push(`配额将于 ${resetSeconds} 秒后重置。`);
            }
        }

        const description = descriptionParts.join(" ");

        toast.error(
            description ? `${error.message}\n${description}` : error.message,
            {
                id: `admin-query-error-${error.code ?? error.status}`,
            },
        );
        return;
    }

    if (error instanceof Error) {
        toast.error(error.message, {
            id: `admin-query-error-generic`,
        });
        return;
    }

    toast.error("请求失败，请稍后再试。", {
        id: `admin-query-error-unknown`,
    });
}

function shouldRetry(error: unknown, failureCount: number) {
    if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
            return false;
        }
        if (error.status === 429) {
            return false;
        }
        return failureCount < 2;
    }

    return failureCount < 3;
}

function createAdminQueryClient() {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: notifyError,
        }),
        mutationCache: new MutationCache({
            onError: notifyError,
        }),
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: (failureCount, error) =>
                    shouldRetry(error, failureCount),
            },
            mutations: {
                retry: (failureCount, error) =>
                    shouldRetry(error, failureCount),
            },
        },
    });
}

export function AdminQueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [client] = useState(() => createAdminQueryClient());

    return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}
