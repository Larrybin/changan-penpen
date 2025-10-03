"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BillingActions() {
    const [loading, setLoading] = useState<string | null>(null);

    async function startCheckout(
        tierId: string,
        productType: "subscription" | "credits",
    ) {
        try {
            setLoading(`${tierId}-${productType}`);
            const resp = await fetch("/api/creem/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierId, productType }),
            });
            const json: any = await resp.json();
            const normalized = json?.data?.checkoutUrl as string | undefined;
            if (!resp.ok || !normalized) {
                throw new Error(json?.error || "Failed to create checkout");
            }
            window.location.href = normalized as string;
        } catch (e: any) {
            alert(e?.message || "Checkout error");
        } finally {
            setLoading(null);
        }
    }

    async function openCustomerPortal() {
        try {
            setLoading("portal");
            const resp = await fetch("/api/creem/customer-portal");
            const json: any = await resp.json();
            if (!resp.ok) {
                throw new Error(
                    typeof json === "string"
                        ? json
                        : json?.error || "Failed to get portal link",
                );
            }
            const url = json?.data?.portalUrl as string | undefined;
            if (!url) throw new Error("Portal URL missing");
            window.location.href = url;
        } catch (e: any) {
            alert(e?.message || "Portal error");
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
