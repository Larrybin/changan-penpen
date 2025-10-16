"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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

export default function BillingActions() {
    const [loading, setLoading] = useState<string | null>(null);

    async function startCheckout(
        tierId: string,
        productType: "subscription" | "credits",
    ) {
        try {
            setLoading(`${tierId}-${productType}`);
            const resp = await fetch("/api/v1/creem/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierId, productType }),
            });
            const payload: unknown = await resp.json();
            const normalized = readUrl(payload, "checkoutUrl");
            if (!resp.ok || !normalized) {
                throw new Error(
                    readErrorMessage(payload) || "Failed to create checkout",
                );
            }
            window.location.href = normalized;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Checkout error";
            alert(message);
        } finally {
            setLoading(null);
        }
    }

    async function openCustomerPortal() {
        try {
            setLoading("portal");
            const resp = await fetch("/api/v1/creem/customer-portal");
            const payload: unknown = await resp.json();
            if (!resp.ok) {
                throw new Error(
                    readErrorMessage(payload) || "Failed to get portal link",
                );
            }
            const url = readUrl(payload, "portalUrl");
            if (!url) throw new Error("Portal URL missing");
            window.location.href = url;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Portal error";
            alert(message);
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <Button
                className="w-full"
                onClick={() => startCheckout("tier-6-credits", "credits")}
                disabled={loading !== null}
            >
                {loading === "tier-6-credits-credits"
                    ? "Processing..."
                    : "购买 6 积分（示例）"}
            </Button>
            <Button
                className="w-full"
                variant="outline"
                onClick={() => startCheckout("tier-pro", "subscription")}
                disabled={loading !== null}
            >
                {loading === "tier-pro-subscription"
                    ? "Processing..."
                    : "订阅 Pro（示例）"}
            </Button>
            <Button
                className="w-full"
                variant="secondary"
                onClick={openCustomerPortal}
                disabled={loading !== null}
            >
                {loading === "portal" ? "Opening..." : "管理订阅（账单门户）"}
            </Button>
        </div>
    );
}
