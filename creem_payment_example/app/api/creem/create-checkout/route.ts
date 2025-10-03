import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SUBSCRIPTION_TIERS, CREDITS_TIERS } from "@/config/subscriptions";
import { createCheckoutSession } from "@/app/actions";

type Body = {
  productId?: string;
  productType?: string; // "subscription" | "credits" | custom labels like "chinese-name-credits"
  tierId?: string; // preferred: map from config tiers
  // quantity?: number; // deprecated: do NOT trust client-provided quantity
  discountCode?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Body;

    // Resolve product type
    const normalizedType = (body.productType || "").toLowerCase();
    const isCredits =
      normalizedType === "credits" || normalizedType.includes("credits");
    const isSubscription = normalizedType === "subscription";

    // Build whitelists from config
    const allCreditTiers = CREDITS_TIERS;
    const allSubTiers = SUBSCRIPTION_TIERS;
    const allowedProductIds = new Set([
      ...allCreditTiers.map((t) => t.productId),
      ...allSubTiers.map((t) => t.productId),
    ]);

    // Resolve product based on tierId or whitelisted productId
    let productId = body.productId?.trim();
    let creditsAmount: number | undefined = undefined;

    if (!productId) {
      // Try to map by tierId from config
      if (body.tierId) {
        const creditTier = allCreditTiers.find((t) => t.id === body.tierId);
        const subTier = allSubTiers.find((t) => t.id === body.tierId);
        if (creditTier) {
          productId = creditTier.productId;
          creditsAmount = creditTier.creditAmount;
        } else if (subTier) {
          productId = subTier.productId;
        }
      }

      // If still not found, pick a sensible default from config
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

    if (!productId) {
      return NextResponse.json(
        {
          error:
            "Missing product mapping. Provide productId or configure tiers in config/subscriptions.ts.",
        },
        { status: 400 }
      );
    }

    // Validate provided productId is whitelisted in config
    if (!allowedProductIds.has(productId)) {
      return NextResponse.json(
        { error: "Invalid productId. Must be defined in config/subscriptions.ts" },
        { status: 400 }
      );
    }

    // Determine final product type and credits amount
    const productType: "subscription" | "credits" = isSubscription
      ? "subscription"
      : "credits";
    // If credits, do NOT trust client-provided quantity; use config-derived creditsAmount only

    // Safety checks
    if (!user.email) {
      return NextResponse.json(
        { error: "User email not found for checkout" },
        { status: 400 }
      );
    }

    const checkoutUrl = await createCheckoutSession(
      productId,
      user.email,
      user.id,
      productType,
      creditsAmount,
      body.discountCode
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Create checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create checkout", details: message },
      { status: 500 }
    );
  }
}

