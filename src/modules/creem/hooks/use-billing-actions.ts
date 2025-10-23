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

export function useBillingActions() {
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    const startCheckout = useCallback(async (options: StartCheckoutOptions) => {
        const {
            tierId,
            productId,
            productType,
            discountCode,
            requestId,
            units,
            friendlyErrorMessage,
            onRedirect,
        } = options;
        const fallbackKey = `checkout:${productType}:${tierId ?? productId ?? "unknown"}`;
        const key = buildLoadingKey(options, fallbackKey);
        setLoadingKey(key);

        const body: Record<string, unknown> = { productType };
        if (tierId) body.tierId = tierId;
        if (productId) body.productId = productId;
        if (discountCode) body.discountCode = discountCode;
        if (requestId) body.requestId = requestId;
        if (typeof units === "number") body.units = units;

        const errorMessage =
            friendlyErrorMessage ?? "无法创建结账，请稍后重试。";

        try {
            const resp = await fetch("/api/v1/creem/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const payload = await parseResponseBody(resp);
            if (!resp.ok) {
                logFailure("checkout request failed", {
                    status: resp.status,
                    tierId: tierId ?? null,
                    productId: productId ?? null,
                    productType,
                    error: readErrorMessage(payload) ?? null,
                    payload,
                });
                toast.error(errorMessage);
                return;
            }

            const checkoutUrl = readUrl(payload, "checkoutUrl");
            if (!checkoutUrl) {
                logFailure("checkout response missing url", {
                    tierId: tierId ?? null,
                    productId: productId ?? null,
                    productType,
                    payload,
                });
                toast.error(errorMessage);
                return;
            }

            (onRedirect ?? defaultRedirect)(checkoutUrl);
        } catch (error) {
            logFailure("checkout call threw", {
                error,
                tierId: tierId ?? null,
                productId: productId ?? null,
                productType,
            });
            toast.error(errorMessage);
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
