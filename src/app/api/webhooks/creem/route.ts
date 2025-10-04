import { headers } from "next/headers";
import { verifyCreemWebhookSignature } from "@/modules/creem/utils/verify-signature";
import type {
    CreemWebhookEvent,
    CreemCheckout,
    CreemSubscription,
} from "@/modules/creem/models/creem.types";
import {
    createOrUpdateCustomer,
    createOrUpdateSubscription,
    addCreditsToCustomer,
    getCustomerIdByUserId,
} from "@/modules/creem/services/billing.service";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: Request) {
    try {
        const raw = await request.text();
        const signature = (await headers()).get("creem-signature") || "";
        const { env } = await getCloudflareContext({ async: true });

        if (
            env.CREEM_LOG_WEBHOOK_SIGNATURE === "1" &&
            process.env.NODE_ENV !== "production"
        ) {
            console.log("[creem webhook] signature:", signature);
        }

        const valid = await verifyCreemWebhookSignature(
            raw,
            signature,
            env.CREEM_WEBHOOK_SECRET,
        );
        if (!valid) {
            return new Response("Invalid signature", { status: 401 });
        }

        const event = JSON.parse(raw) as CreemWebhookEvent;
        switch (event.eventType) {
            case "checkout.completed":
                await onCheckoutCompleted(event.object as CreemCheckout);
                break;
            case "subscription.active":
            case "subscription.paid":
            case "subscription.canceled":
            case "subscription.expired":
            case "subscription.trialing":
                await onSubscriptionChanged(event.object as CreemSubscription);
                break;
            default:
                console.log(`[creem webhook] unhandled: ${event.eventType}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[creem webhook] error:", msg);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

async function onCheckoutCompleted(checkout: CreemCheckout) {
    if (!checkout?.metadata?.user_id)
        throw new Error("Missing user_id in metadata");
    const userId = checkout.metadata.user_id;

    const customerId = await createOrUpdateCustomer(checkout.customer, userId);

    if (checkout?.metadata?.product_type === "credits") {
        const credits = checkout?.metadata?.credits || 0;
        const orderId = checkout?.order?.id;
        await addCreditsToCustomer(
            customerId,
            credits,
            orderId,
            `Purchased ${credits} credits`,
        );
        return;
    }

    if (checkout.subscription) {
        await createOrUpdateSubscription(checkout.subscription, customerId);
    }
}

async function onSubscriptionChanged(subscription: CreemSubscription) {
    const metaUserId = (subscription?.metadata as any)?.user_id as
        | string
        | undefined;

    let customerId: number | null = null;
    if (
        typeof subscription.customer === "object" &&
        subscription.customer?.id
    ) {
        const userId = metaUserId || "";
        customerId = await createOrUpdateCustomer(
            subscription.customer as any,
            userId,
        );
    } else if (metaUserId) {
        customerId = await getCustomerIdByUserId(metaUserId);
    }
    if (!customerId)
        throw new Error("Cannot resolve customer for subscription event");

    await createOrUpdateSubscription(subscription, customerId);
}
