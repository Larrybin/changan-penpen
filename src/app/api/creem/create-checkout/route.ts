import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { applyRateLimit } from "@/lib/rate-limit";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import {
    CREDITS_TIERS,
    SUBSCRIPTION_TIERS,
} from "@/modules/creem/config/subscriptions";

type Body = {
    productId?: string;
    productType?: string; // "subscription" | "credits"
    tierId?: string;
    discountCode?: string;
};

export async function POST(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: headers() });
        if (!session?.user) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Unauthorized",
                    data: null,
                }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const { env } = await getCloudflareContext({ async: true });

        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "creem:create-checkout",
            uniqueToken: session.user.id,
            env: { RATE_LIMITER: env.RATE_LIMITER },
            message: "Too many checkout attempts",
        });
        if (!rateLimitResult.ok) {
            return rateLimitResult.response;
        }
        const origin = headers().get("origin");
        const body = (await request.json()) as Body;

        // 必要环境变量校验（缺失则直接失败，避免上游 503）
        if (!env.CREEM_API_URL || !env.CREEM_API_KEY) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing CREEM_API_URL or CREEM_API_KEY",
                    data: null,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const normalizedType = (body.productType || "").toLowerCase();
        const _isCredits =
            normalizedType === "credits" || normalizedType.includes("credits");
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
                    const tier =
                        allSubTiers.find((t) => t.featured) || allSubTiers[0];
                    productId = tier?.productId;
                } else {
                    const tier =
                        allCreditTiers.find((t) => t.featured) ||
                        allCreditTiers[0];
                    productId = tier?.productId;
                    creditsAmount = tier?.creditAmount;
                }
            }
        }

        if (!productId || !allowed.has(productId)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid or missing productId/tierId",
                    data: null,
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const productType: "subscription" | "credits" = isSubscription
            ? "subscription"
            : "credits";
        const email = session.user.email;
        if (!email) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "User email required",
                    data: null,
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const requestBody: {
            product_id: string;
            customer: { email: string };
            metadata: {
                user_id: string;
                product_type: "subscription" | "credits";
                credits: number;
            };
            success_url?: string;
            cancel_url?: string;
            discount_code?: string;
        } = {
            product_id: productId,
            customer: { email },
            metadata: {
                user_id: session.user.id,
                product_type: productType,
                credits: productType === "credits" ? creditsAmount || 0 : 0,
            },
        };

        const successUrl =
            env.CREEM_SUCCESS_URL ||
            (origin ? `${origin}/billing/success` : undefined);
        const cancelUrl =
            env.CREEM_CANCEL_URL ||
            (origin ? `${origin}/billing/cancel` : undefined);
        if (successUrl) requestBody.success_url = successUrl;
        if (cancelUrl) requestBody.cancel_url = cancelUrl;
        if (body.discountCode) requestBody.discount_code = body.discountCode;

        // 上游请求：增加超时、重试（指数退避 + 抖动）与错误归因
        const { ok, status, data, text, attempts, contentType } =
            await fetchWithRetry(`${env.CREEM_API_URL}/checkouts`, {
                method: "POST",
                headers: {
                    "x-api-key": env.CREEM_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
            });

        if (!ok) {
            const snippet = (text || "").slice(0, 300);
            const isAuthErr = status === 401 || status === 403;
            const isClientErr =
                status === 400 || status === 404 || status === 422;
            const mapped = isAuthErr ? 401 : isClientErr ? 400 : 502;
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Create checkout failed",
                    data: null,
                    meta: {
                        status,
                        attempts,
                        contentType: contentType || null,
                        upstreamBodySnippet: snippet,
                    },
                }),
                {
                    status: mapped,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        type CreateCheckoutResponse = { checkout_url?: string };
        const json = data as CreateCheckoutResponse;
        const checkoutUrl = json?.checkout_url;
        if (!checkoutUrl || typeof checkoutUrl !== "string") {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid response from Creem: missing checkout_url",
                    data: null,
                }),
                {
                    status: 502,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
        // 标准化字段：data.checkoutUrl；附带 meta.raw 便于调试（已移除 legacy 字段）
        return new Response(
            JSON.stringify({
                success: true,
                data: { checkoutUrl },
                error: null,
                meta: { raw: json },
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ success: false, error: message, data: null }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

// 内部：带超时与重试的 fetch（针对 Workers 环境）
async function fetchWithRetry(
    url: string,
    init: RequestInit,
    options?: { attempts?: number; timeoutMs?: number },
): Promise<{
    ok: boolean;
    status: number;
    data?: unknown;
    text?: string;
    attempts: number;
    contentType?: string | null;
}> {
    const maxAttempts = Math.max(1, options?.attempts ?? 3);
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 8000);

    let lastText: string | undefined;
    let lastStatus = 0;
    let lastContentType: string | undefined | null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, {
                ...init,
                signal: controller.signal,
            });
            clearTimeout(timer);

            lastStatus = resp.status;
            lastContentType = resp.headers.get("content-type") || undefined;

            const isJson = (lastContentType || "")
                .toLowerCase()
                .includes("application/json");
            if (resp.ok) {
                let data: unknown;
                if (isJson) {
                    data = await resp.json();
                } else {
                    const txt = await resp.text();
                    try {
                        data = JSON.parse(txt);
                    } catch {
                        // 返回原始文本，避免 JSON.parse 抛错导致整体失败
                        data = txt;
                    }
                }
                return {
                    ok: true,
                    status: resp.status,
                    data,
                    attempts: attempt,
                    contentType: lastContentType || null,
                };
            }

            // 读取文本用于诊断；对 5xx/429 进行重试
            const txt = await resp.text();
            lastText = txt;

            if (resp.status === 429 || resp.status >= 500) {
                if (attempt < maxAttempts) {
                    const backoff = backoffWithJitter(attempt);
                    await sleep(backoff);
                    continue;
                }
            }

            return {
                ok: false,
                status: resp.status,
                text: txt,
                attempts: attempt,
                contentType: lastContentType || null,
            };
        } catch (err) {
            clearTimeout(timer);
            // 网络/超时错误：重试
            if (attempt < maxAttempts) {
                const backoff = backoffWithJitter(attempt);
                await sleep(backoff);
                continue;
            }
            const msg = err instanceof Error ? err.message : String(err);
            return {
                ok: false,
                status: lastStatus || 0,
                text: msg,
                attempts: attempt,
                contentType: lastContentType || null,
            };
        }
    }

    return {
        ok: false,
        status: lastStatus || 0,
        text: lastText,
        attempts: maxAttempts,
        contentType: lastContentType || null,
    };
}

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

function backoffWithJitter(attempt: number) {
    const base = Math.min(1000 * 2 ** (attempt - 1), 5000); // 1s, 2s, 4s, capped 5s
    const jitter = Math.floor(Math.random() * 300);
    return base + jitter;
}
