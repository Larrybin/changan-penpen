import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { SUBSCRIPTION_TIERS, CREDITS_TIERS } from "@/modules/creem/config/subscriptions";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";

type Body = {
    productId?: string;
    productType?: string; // "subscription" | "credits"
    tierId?: string;
    discountCode?: string;
};

export async function POST(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized", data: null }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { env } = await getCloudflareContext();
        const origin = (await headers()).get("origin");
        const body = (await request.json()) as Body;

        const normalizedType = (body.productType || "").toLowerCase();
        const isCredits = normalizedType === "credits" || normalizedType.includes("credits");
        const isSubscription = normalizedType === "subscription";

        const allCreditTiers = CREDITS_TIERS;
        const allSubTiers = SUBSCRIPTION_TIERS;
        const allowed = new Set([
            ...allCreditTiers.map((t) => t.productId),
            ...allSubTiers.map((t) => t.productId),
        ]);

        let productId = body.productId?.trim();
        let creditsAmount: number | undefined;

        if (!productId) {
            if (body.tierId) {
                const c = allCreditTiers.find((t) => t.id === body.tierId);
                const s = allSubTiers.find((t) => t.id === body.tierId);
                if (c) {
                    productId = c.productId;
                    creditsAmount = c.creditAmount;
                } else if (s) {
                    productId = s.productId;
                }
            }
            if (!productId) {
                if (isSubscription) {
                    const tier = allSubTiers.find((t) => t.featured) || allSubTiers[0];
                    productId = tier?.productId;
                } else {
                    const tier = allCreditTiers.find((t) => t.featured) || allCreditTiers[0];
                    productId = tier?.productId;
                    creditsAmount = tier?.creditAmount;
                }
            }
        }

        if (!productId || !allowed.has(productId)) {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid or missing productId/tierId", data: null }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        const productType: "subscription" | "credits" = isSubscription ? "subscription" : "credits";
        const email = session.user.email;
        if (!email) {
            return new Response(JSON.stringify({ success: false, error: "User email required", data: null }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const requestBody: Record<string, any> = {
            product_id: productId,
            customer: { email },
            metadata: {
                user_id: session.user.id,
                product_type: productType,
                credits: productType === "credits" ? creditsAmount || 0 : 0,
            },
        };

        const successUrl = env.CREEM_SUCCESS_URL || (origin ? `${origin}/billing/success` : undefined);
        const cancelUrl = env.CREEM_CANCEL_URL || (origin ? `${origin}/billing/cancel` : undefined);
        if (successUrl) requestBody.success_url = successUrl;
        if (cancelUrl) requestBody.cancel_url = cancelUrl;
        if (body.discountCode) requestBody.discount_code = body.discountCode;

        const resp = await fetch(`${env.CREEM_API_URL}/checkouts`, {
            method: "POST",
            headers: {
                "x-api-key": env.CREEM_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });
        if (!resp.ok) {
            const txt = await resp.text();
            return new Response(JSON.stringify({ success: false, error: `Create checkout failed: ${txt}`, data: null }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
        type CreateCheckoutResponse = { checkout_url?: string };
        const json = (await resp.json()) as unknown as CreateCheckoutResponse;
        const checkoutUrl = json?.checkout_url;
        if (!checkoutUrl || typeof checkoutUrl !== "string") {
            return new Response(
                JSON.stringify({ success: false, error: "Invalid response from Creem: missing checkout_url", data: null }),
                { status: 502, headers: { "Content-Type": "application/json" } },
            );
        }
        // 标准化字段：data.checkoutUrl；附带 meta.raw 便于调试（已移除 legacy 字段）
        return new Response(JSON.stringify({ success: true, data: { checkoutUrl }, error: null, meta: { raw: json } }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ success: false, error: message, data: null }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
