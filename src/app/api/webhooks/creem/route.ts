import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { applyRateLimit } from "@/lib/rate-limit";
import type {
    CreemCheckout,
    CreemCustomer,
    CreemSubscription,
    CreemWebhookEvent,
} from "@/modules/creem/models/creem.types";
import {
    addCreditsToCustomer,
    createOrUpdateCustomer,
    createOrUpdateSubscription,
    getCustomerIdByUserId,
} from "@/modules/creem/services/billing.service";
import { verifyCreemWebhookSignature } from "@/modules/creem/utils/verify-signature";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isCreemCustomer(value: unknown): value is CreemCustomer {
    return isRecord(value) && typeof value.id === "string";
}

function isCreemSubscriptionPayload(
    value: unknown,
): value is CreemSubscription {
    if (!isRecord(value) || typeof value.id !== "string") {
        return false;
    }
    const customer = value.customer;
    return typeof customer === "string" || isCreemCustomer(customer);
}

function isCreemCheckoutPayload(value: unknown): value is CreemCheckout {
    if (!isRecord(value) || !isCreemCustomer(value.customer)) {
        return false;
    }
    const subscription = value.subscription;
    if (subscription && !isCreemSubscriptionPayload(subscription)) {
        return false;
    }
    return true;
}

export async function POST(request: Request) {
    try {
        const raw = await request.text();
        const signature = (await headers()).get("creem-signature") || "";
        const { env } = await getCloudflareContext({ async: true });

        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "creem:webhook",
            uniqueToken: signature,
            env,
            message: "Too many webhook requests",
        });
        if (!rateLimitResult.ok) {
            return rateLimitResult.response;
        }

        const envMode = String(env.NEXTJS_ENV ?? "").toLowerCase();
        if (
            env.CREEM_LOG_WEBHOOK_SIGNATURE === "1" &&
            envMode !== "production"
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

        const parsed = JSON.parse(raw) as unknown;
        if (!isRecord(parsed) || typeof parsed.eventType !== "string") {
            throw new Error("Invalid webhook payload");
        }
        const event: CreemWebhookEvent = {
            eventType: parsed.eventType,
            object: parsed.object,
        };
        switch (event.eventType) {
            case "checkout.completed":
                if (!isCreemCheckoutPayload(event.object)) {
                    throw new Error("Invalid checkout payload");
                }
                await onCheckoutCompleted(event.object);
                break;
            case "subscription.active":
            case "subscription.paid":
            case "subscription.canceled":
            case "subscription.expired":
            case "subscription.trialing":
                if (!isCreemSubscriptionPayload(event.object)) {
                    throw new Error("Invalid subscription payload");
                }
                await onSubscriptionChanged(event.object);
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
    const metaUserId = (() => {
        const metadata = subscription.metadata;
        if (!metadata) {
            return undefined;
        }
        const userId = metadata.user_id;
        return typeof userId === "string" ? userId : undefined;
    })();

    let customerId: number | null = null;
    if (
        typeof subscription.customer === "object" &&
        subscription.customer?.id
    ) {
        const userId = metaUserId || "";
        customerId = await createOrUpdateCustomer(
            subscription.customer,
            userId,
        );
    } else if (metaUserId) {
        customerId = await getCustomerIdByUserId(metaUserId);
    }
    if (!customerId)
        throw new Error("Cannot resolve customer for subscription event");

    await createOrUpdateSubscription(subscription, customerId);
}
