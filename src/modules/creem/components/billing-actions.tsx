"use client";

import { Button } from "@/components/ui/button";
import { secureRandomInt } from "@/lib/random";
import {
    CREDITS_TIERS,
    SUBSCRIPTION_TIERS,
} from "@/modules/creem/config/subscriptions";
import { useBillingActions } from "@/modules/creem/hooks/use-billing-actions";

function generateClientRequestId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `checkout-${Date.now()}-${secureRandomInt(1_000_000)}`;
}

export default function BillingActions() {
    const { startCheckout, openCustomerPortal, isLoading, isBusy } =
        useBillingActions();

    const featuredCreditTier =
        CREDITS_TIERS.find((tier) => tier.featured) ?? CREDITS_TIERS[0];
    const featuredSubscriptionTier =
        SUBSCRIPTION_TIERS.find((tier) => tier.featured) ??
        SUBSCRIPTION_TIERS[0];

    return (
        <div className="flex flex-col gap-3">
            <Button
                className="w-full"
                onClick={() => {
                    if (!featuredCreditTier) return;
                    startCheckout({
                        tierId: featuredCreditTier.id,
                        productType: "credits",
                        discountCode:
                            featuredCreditTier.discountCode || undefined,
                        loadingKey: `${featuredCreditTier.id}-credits`,
                        friendlyErrorMessage: "无法创建积分结账，请稍后重试。",
                        requestId: generateClientRequestId(),
                    });
                }}
                disabled={isBusy || !featuredCreditTier}
            >
                {isLoading(`${featuredCreditTier?.id ?? ""}-credits`)
                    ? "Processing..."
                    : featuredCreditTier
                      ? `购买 ${featuredCreditTier.name}`
                      : "暂无可用积分套餐"}
            </Button>
            <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                    if (!featuredSubscriptionTier) return;
                    startCheckout({
                        tierId: featuredSubscriptionTier.id,
                        productType: "subscription",
                        discountCode:
                            featuredSubscriptionTier.discountCode || undefined,
                        loadingKey: `${featuredSubscriptionTier.id}-subscription`,
                        friendlyErrorMessage: "无法创建订阅结账，请稍后重试。",
                        requestId: generateClientRequestId(),
                        units:
                            featuredSubscriptionTier.defaultUnits !== undefined
                                ? featuredSubscriptionTier.defaultUnits
                                : 1,
                    });
                }}
                disabled={isBusy || !featuredSubscriptionTier}
            >
                {isLoading(`${featuredSubscriptionTier?.id ?? ""}-subscription`)
                    ? "Processing..."
                    : featuredSubscriptionTier
                      ? `订阅 ${featuredSubscriptionTier.name}`
                      : "暂无可用订阅套餐"}
            </Button>
            <Button
                className="w-full"
                variant="secondary"
                onClick={() =>
                    openCustomerPortal({
                        loadingKey: "portal",
                        friendlyErrorMessage: "无法打开账单门户，请稍后重试。",
                    })
                }
                disabled={isBusy}
            >
                {isLoading("portal") ? "Opening..." : "管理订阅（账单门户）"}
            </Button>
        </div>
    );
}
