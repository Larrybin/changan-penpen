import { getPlatformContext } from "@/lib/platform/context";
import handleApiError from "@/lib/api-error";
import { getRedisClient } from "@/lib/cache";
import { ApiError } from "@/lib/http-error";
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
import {
    createRedisReplayProtectionStore,
    verifyCreemWebhookSignature,
} from "@/modules/creem/utils/verify-signature";

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

type WaitUntil = (promise: Promise<unknown>) => void;

interface WebhookRequestContext {
    rawBody: string;
    signature: string;
    env: CloudflareEnv;
    waitUntil?: WaitUntil;
}

async function getWebhookRequestContext(
    request: Request,
): Promise<WebhookRequestContext> {
    const rawBody = await request.text();
    const signature = request.headers.get("creem-signature") ?? "";
    const platformContext = await getPlatformContext({ async: true });
    const env = platformContext.env as unknown as CloudflareEnv;
    const waitUntil = platformContext.waitUntil;
    return { rawBody, signature, env, waitUntil };
}

async function enforceWebhookRateLimit(
    request: Request,
    context: WebhookRequestContext,
): Promise<Response | null> {
    const result = await applyRateLimit({
        request,
        identifier: "creem:webhook",
        env: {
            RATE_LIMITER: context.env.RATE_LIMITER,
            UPSTASH_REDIS_REST_URL: context.env.UPSTASH_REDIS_REST_URL,
            UPSTASH_REDIS_REST_TOKEN: context.env.UPSTASH_REDIS_REST_TOKEN,
        },
        message: "Too many webhook requests",
        upstash: {
            strategy: { type: "fixed", requests: 60, window: "60 s" },
            prefix: "@ratelimit/webhook",
            includeHeaders: true,
        },
        waitUntil: context.waitUntil,
    });
    return result.ok ? null : result.response;
}

function logWebhookSignature(signature: string, env: CloudflareEnv) {
    const envMode = String(env.NEXTJS_ENV ?? "").toLowerCase();
    if (env.CREEM_LOG_WEBHOOK_SIGNATURE === "1" && envMode !== "production") {
        console.info("[creem webhook] signature:", signature);
    }
}

function assertWebhookSecret(env: CloudflareEnv): string {
    if (!env.CREEM_WEBHOOK_SECRET) {
        console.error("[creem webhook] missing CREEM_WEBHOOK_SECRET");
        throw new ApiError("Missing webhook secret", {
            status: 500,
            code: "SERVICE_CONFIGURATION_ERROR",
            severity: "high",
        });
    }
    return env.CREEM_WEBHOOK_SECRET;
}

function createReplayProtectionStore(env: CloudflareEnv) {
    const redis = getRedisClient({
        UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis
        ? createRedisReplayProtectionStore({
              set: (key, value, options) =>
                  redis.set(`creem:webhook:replay:${key}`, value, options),
          })
        : undefined;
}

async function verifyWebhookPayload(
    payload: string,
    signature: string,
    secret: string,
    replayStore:
        | ReturnType<typeof createRedisReplayProtectionStore>
        | undefined,
) {
    const valid = await verifyCreemWebhookSignature(
        payload,
        signature,
        secret,
        {
            replayStore,
            toleranceSeconds: 5 * 60,
        },
    );
    if (!valid) {
        throw new ApiError("Invalid signature", {
            status: 401,
            code: "INVALID_SIGNATURE",
            severity: "high",
        });
    }
}

function parseWebhookEvent(rawBody: string): CreemWebhookEvent {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!isRecord(parsed) || typeof parsed.eventType !== "string") {
        throw new Error("Invalid webhook payload");
    }
    return {
        eventType: parsed.eventType,
        object: parsed.object,
    } satisfies CreemWebhookEvent;
}

async function dispatchWebhookEvent(event: CreemWebhookEvent) {
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
            console.info(`[creem webhook] unhandled: ${event.eventType}`);
    }
}

export async function POST(request: Request) {
    try {
        const context = await getWebhookRequestContext(request);
        const rateLimitedResponse = await enforceWebhookRateLimit(
            request,
            context,
        );
        if (rateLimitedResponse) {
            return rateLimitedResponse;
        }

        logWebhookSignature(context.signature, context.env);

        const secret = assertWebhookSecret(context.env);
        const replayStore = createReplayProtectionStore(context.env);
        await verifyWebhookPayload(
            context.rawBody,
            context.signature,
            secret,
            replayStore,
        );

        const event = parseWebhookEvent(context.rawBody);
        await dispatchWebhookEvent(event);

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[creem webhook] error:", error);
        return handleApiError(error);
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
