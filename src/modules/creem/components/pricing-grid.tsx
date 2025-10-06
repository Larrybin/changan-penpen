"use client";

import { useState } from "react";
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
    return typeof error === "string" ? error : undefined;
}

export default function PricingGrid() {
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
            const payload: unknown = await resp.json();
            const checkoutUrl = readUrl(payload, "checkoutUrl");
            if (!resp.ok || !checkoutUrl) {
                throw new Error(readErrorMessage(payload) || "创建结账失败");
            }
            window.location.href = checkoutUrl;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "结账错误";
            alert(message);
        } finally {
            setLoading(null);
        }
    }

    async function openCustomerPortal() {
        try {
            setLoading("portal");
            const resp = await fetch("/api/creem/customer-portal");
            const payload: unknown = await resp.json();
            if (!resp.ok) {
                throw new Error(
                    readErrorMessage(payload) || "获取账单门户失败",
                );
            }
            const url = readUrl(payload, "portalUrl");
            if (!url) throw new Error("门户链接缺失");
            window.location.href = url;
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "打开门户失败";
            alert(message);
        } finally {
            setLoading(null);
        }
    }

    return (
        <div className="space-y-10">
            <div className="flex justify-center">
                <Button
                    variant="secondary"
                    onClick={openCustomerPortal}
                    disabled={loading !== null}
                >
                    {loading === "portal"
                        ? "打开中..."
                        : "管理订阅（账单门户）"}
                </Button>
            </div>

            {/* 订阅套餐 */}
            <section>
                <h2 className="text-subtitle font-semibold mb-6 text-center">
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
                                        <span className="text-xs rounded bg-primary text-primary-foreground px-2 py-0.5">
                                            推荐
                                        </span>
                                    ) : null}
                                </CardTitle>
                                <CardDescription>
                                    <div className="text-2xl font-bold">
                                        {tier.priceMonthly}
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        {tier.description}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                    {(tier.features || []).map((feature) => (
                                        <li key={`${tier.id}-${feature}`}>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    disabled={loading !== null}
                                    onClick={() =>
                                        startCheckout(tier.id, "subscription")
                                    }
                                >
                                    {loading === `${tier.id}-subscription`
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
                <h2 className="text-subtitle font-semibold mb-6 text-center">
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
                                        <span className="text-xs rounded bg-primary text-primary-foreground px-2 py-0.5">
                                            热门
                                        </span>
                                    ) : null}
                                </CardTitle>
                                <CardDescription>
                                    <div className="text-2xl font-bold">
                                        {tier.priceMonthly}
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        {tier.description}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                                    <li>包含积分：{tier.creditAmount}</li>
                                    {(tier.features || []).map((feature) => (
                                        <li key={`${tier.id}-${feature}`}>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full"
                                    disabled={loading !== null}
                                    onClick={() =>
                                        startCheckout(tier.id, "credits")
                                    }
                                >
                                    {loading === `${tier.id}-credits`
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
