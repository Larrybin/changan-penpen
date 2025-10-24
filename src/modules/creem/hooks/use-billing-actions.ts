"use client";

import { useCallback, useState } from "react";
import { toast } from "@/lib/toast";

type ProductType = "subscription" | "credits";

type RedirectHandler = (url: string) => void;

type BaseOptions = {
    loadingKey?: string;
    friendlyErrorMessage?: string;
    onRedirect?: RedirectHandler;
};

type StartCheckoutOptions = BaseOptions & {
    tierId?: string;
    productId?: string;
    productType: ProductType;
    discountCode?: string;
    requestId?: string;
    units?: number;
};

type CustomerPortalOptions = BaseOptions;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function readUrl(
    payload: unknown,
    key: "checkoutUrl" | "portalUrl",
): string | undefined {
    if (!isRecord(payload)) {
        return undefined;
    }
    const data = payload.data;
    if (!isRecord(data)) {
        return undefined;
    }
    const url = data[key];
    return typeof url === "string" ? url : undefined;
}

function readErrorMessage(payload: unknown): string | undefined {
    if (typeof payload === "string") {
        return payload;
    }
    if (!isRecord(payload)) {
        return undefined;
    }
    const error = payload.error;
    if (typeof error === "string") {
        return error;
    }
    if (isRecord(error) && typeof error.message === "string") {
        return error.message;
    }
    return undefined;
}

async function parseResponseBody(resp: Response): Promise<unknown> {
    try {
        const text = await resp.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    } catch (error) {
        console.error(
            "[useBillingActions] failed to read response body",
            error,
        );
        return null;
    }
}

function defaultRedirect(url: string) {
    window.location.href = url;
}

function buildLoadingKey(
    options: StartCheckoutOptions | CustomerPortalOptions,
    fallback: string,
) {
    if (options.loadingKey && options.loadingKey.trim().length > 0) {
        return options.loadingKey;
    }
    return fallback;
}

function logFailure(context: string, details: Record<string, unknown>) {
    console.error(`[useBillingActions] ${context}`, details);
}

function buildCheckoutLogContext(options: StartCheckoutOptions) {
    return {
        tierId: options.tierId ?? null,
        productId: options.productId ?? null,
        productType: options.productType,
    } as const;
}

function createCheckoutBody(options: StartCheckoutOptions) {
    const { productType, tierId, productId, discountCode, requestId, units } =
        options;

    const body: Record<string, unknown> = { productType };
    const optionalEntries: Array<[string, unknown]> = [
        ["tierId", tierId],
        ["productId", productId],
        ["discountCode", discountCode],
        ["requestId", requestId],
        ["units", typeof units === "number" ? units : undefined],
    ];

    optionalEntries.forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            body[key] = value;
        }
    });

    return body;
}

function resolveCheckoutLoadingKey(options: StartCheckoutOptions) {
    const fallback = [
        "checkout",
        options.productType,
        options.tierId ?? options.productId ?? "unknown",
    ].join(":");
    return buildLoadingKey(options, fallback);
}

async function performCheckoutRequest(body: Record<string, unknown>) {
    const response = await fetch("/api/v1/creem/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const payload = await parseResponseBody(response);
    return { response, payload } as const;
}

function notifyCheckoutFailure(
    reason: string,
    message: string,
    context: Record<string, unknown>,
) {
    logFailure(reason, context);
    toast.error(message);
}

export function useBillingActions() {
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const startCheckout = useCallback(async (options: StartCheckoutOptions) => {
        const { friendlyErrorMessage, onRedirect } = options;
        const key = resolveCheckoutLoadingKey(options);
        setLoadingKey(key);

        const logContext = buildCheckoutLogContext(options);
        const errorMessage =
            friendlyErrorMessage ?? "无法创建结账，请稍后重试。";

        try {
            const { response, payload } = await performCheckoutRequest(
                createCheckoutBody(options),
            );

            if (!response.ok) {
                notifyCheckoutFailure("checkout request failed", errorMessage, {
                    ...logContext,
                    status: response.status,
                    error: readErrorMessage(payload) ?? null,
                    payload,
                });
                return;
            }

            const checkoutUrl = readUrl(payload, "checkoutUrl");
            if (!checkoutUrl) {
                notifyCheckoutFailure(
                    "checkout response missing url",
                    errorMessage,
                    {
                        ...logContext,
                        payload,
                    },
                );
                return;
            }

            (onRedirect ?? defaultRedirect)(checkoutUrl);
        } catch (error) {
            notifyCheckoutFailure("checkout call threw", errorMessage, {
                ...logContext,
                error,
            });
        } finally {
            setLoadingKey(null);
        }
    }, []);

    const openCustomerPortal = useCallback(
        async (options: CustomerPortalOptions = {}) => {
            const { friendlyErrorMessage, onRedirect } = options;
            const key = buildLoadingKey(options, "portal");
            setLoadingKey(key);

            const errorMessage =
                friendlyErrorMessage ?? "无法打开账单门户，请稍后重试。";

            try {
                const resp = await fetch("/api/v1/creem/customer-portal");
                const payload = await parseResponseBody(resp);

                if (!resp.ok) {
                    logFailure("customer portal request failed", {
                        status: resp.status,
                        error: readErrorMessage(payload) ?? null,
                        payload,
                    });
                    toast.error(errorMessage);
                    return;
                }

                const portalUrl = readUrl(payload, "portalUrl");
                if (!portalUrl) {
                    logFailure("customer portal response missing url", {
                        payload,
                    });
                    toast.error(errorMessage);
                    return;
                }

                (onRedirect ?? defaultRedirect)(portalUrl);
            } catch (error) {
                logFailure("customer portal call threw", { error });
                toast.error(errorMessage);
            } finally {
                setLoadingKey(null);
            }
        },
        [],
    );

    const isLoading = useCallback(
        (key: string) => loadingKey === key,
        [loadingKey],
    );
    const isBusy = loadingKey !== null;

    return {
        startCheckout,
        openCustomerPortal,
        loadingKey,
        isLoading,
        isBusy,
    };
}

export type { StartCheckoutOptions, CustomerPortalOptions };
