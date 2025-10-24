"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    CREDITS_TIERS,
    SUBSCRIPTION_TIERS,
} from "@/modules/creem/config/subscriptions";
import { useBillingActions } from "@/modules/creem/hooks/use-billing-actions";

export default function PricingGrid() {
    const { startCheckout, openCustomerPortal, isLoading, isBusy } =
        useBillingActions();

    return (
        <div className="space-y-10">
            <div className="flex justify-center">
                <Button
                    variant="secondary"
                    onClick={() =>
                        openCustomerPortal({
                            loadingKey: "portal",
                            friendlyErrorMessage:
                                "获取账单门户失败，请稍后再试。",
                        })
                    }
                    disabled={isBusy}
                >
                    {isLoading("portal") ? "打开中..." : "管理订阅（账单门户）"}
                </Button>
            </div>

            {/* 订阅套餐 */}
            <section>
                <h2 className="mb-6 text-center font-semibold text-subtitle">
                    订阅套餐
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {SUBSCRIPTION_TIERS.map((tier) => (
                        <Card
                            key={tier.id}
                            className={
                                tier.featured ? "border-primary" : undefined
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{tier.name}</span>
                                    {tier.featured ? (
                                        <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                                            推荐
                                        </span>
                                    ) : null}
                                </CardTitle>
                                <CardDescription>
                                    <div className="font-bold text-2xl">
                                        {tier.priceMonthly}
                                    </div>
                                    <div className="mt-2 text-muted-foreground text-sm">
                                        {tier.description}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                                    {(tier.features || []).map((feature) => (
                                        <li key={`${tier.id}-${feature}`}>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    disabled={isBusy}
                                    onClick={() =>
                                        startCheckout({
                                            tierId: tier.id,
                                            productType: "subscription",
                                            discountCode:
                                                tier.discountCode || undefined,
                                            loadingKey: `${tier.id}-subscription`,
                                            friendlyErrorMessage:
                                                "创建结账失败，请稍后再试。",
                                        })
                                    }
                                >
                                    {isLoading(`${tier.id}-subscription`)
                                        ? "处理中..."
                                        : "订阅"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* 积分套餐 */}
            <section>
                <h2 className="mb-6 text-center font-semibold text-subtitle">
                    积分套餐
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {CREDITS_TIERS.map((tier) => (
                        <Card
                            key={tier.id}
                            className={
                                tier.featured ? "border-primary" : undefined
                            }
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{tier.name}</span>
                                    {tier.featured ? (
                                        <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                                            热门
                                        </span>
                                    ) : null}
                                </CardTitle>
                                <CardDescription>
                                    <div className="font-bold text-2xl">
                                        {tier.priceMonthly}
                                    </div>
                                    <div className="mt-2 text-muted-foreground text-sm">
                                        {tier.description}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                                    <li>包含积分：{tier.creditAmount}</li>
                                    {(tier.features || []).map((feature) => (
                                        <li key={`${tier.id}-${feature}`}>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    disabled={isBusy}
                                    onClick={() =>
                                        startCheckout({
                                            tierId: tier.id,
                                            productType: "credits",
                                            discountCode:
                                                tier.discountCode || undefined,
                                            loadingKey: `${tier.id}-credits`,
                                            friendlyErrorMessage:
                                                "创建结账失败，请稍后再试。",
                                        })
                                    }
                                >
                                    {isLoading(`${tier.id}-credits`)
                                        ? "处理中..."
                                        : "购买积分"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
