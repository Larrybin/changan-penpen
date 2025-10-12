import { getCloudflareContext } from "@opennextjs/cloudflare";
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

// -------------------- helpers to reduce POST complexity --------------------
function isEnvMissing(
    cf: Pick<
        CloudflareEnv,
        | "RATE_LIMITER"
        | "CREEM_API_URL"
        | "CREEM_API_KEY"
        | "CREEM_SUCCESS_URL"
        | "CREEM_CANCEL_URL"
    >,
): boolean {
    return !cf.CREEM_API_URL || !cf.CREEM_API_KEY;
}

function selectProduct(
    input: { productId?: string | null; tierId?: string | null },
    isSubscription: boolean,
): { productId?: string; creditsAmount?: number } {
    let productId = input.productId?.trim();
    let creditsAmount: number | undefined;

    const allCreditTiers = CREDITS_TIERS;
    const allSubTiers = SUBSCRIPTION_TIERS;

    if (!productId && input.tierId) {
        const c = allCreditTiers.find((t) => t.id === input.tierId);
        if (c) return { productId: c.productId, creditsAmount: c.creditAmount };
        const s = allSubTiers.find((t) => t.id === input.tierId);
        if (s) return { productId: s.productId };
    }

    if (!productId) {
        if (isSubscription) {
            const tier = allSubTiers.find((t) => t.featured) || allSubTiers[0];
            productId = tier?.productId;
        } else {
            const tier =
                allCreditTiers.find((t) => t.featured) || allCreditTiers[0];
            productId = tier?.productId;
            creditsAmount = tier?.creditAmount;
        }
    }

    return { productId, creditsAmount };
}

function allowedProductIds(): Set<string> {
    return new Set([
        ...CREDITS_TIERS.map((t) => t.productId),
        ...SUBSCRIPTION_TIERS.map((t) => t.productId),
    ]);
}

function buildRedirectUrls(
    cf: Pick<CloudflareEnv, "CREEM_SUCCESS_URL" | "CREEM_CANCEL_URL">,
    origin: string | null,
): { successUrl?: string; cancelUrl?: string } {
    const successUrl =
        cf.CREEM_SUCCESS_URL ||
        (origin ? `${origin}/billing/success` : undefined);
    const cancelUrl =
        cf.CREEM_CANCEL_URL ||
        (origin ? `${origin}/billing/cancel` : undefined);
    return { successUrl, cancelUrl };
}

function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
}

async function readResponseBody(
    resp: Response,
    isJson: boolean,
): Promise<unknown> {
    if (isJson) return resp.json();
    const txt = await resp.text();
    try {
        return JSON.parse(txt);
    } catch {
        return txt;
    }
}

function _mapUpstreamToHttp(status: number): number {
    if (status === 401 || status === 403) return 401;
    if (status === 400 || status === 404 || status === 422) return 400;
    return 502;
}

function _ensureCheckoutUrl(data: unknown): string | undefined {
    const url = (data as { checkout_url?: string })?.checkout_url;
    return typeof url === "string" && url ? url : undefined;
}

export async function POST(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: request.headers });
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

        const cfContext = await getCloudflareContext({ async: true });
        const cf = cfContext.env as unknown as Pick<
            CloudflareEnv,
            | "RATE_LIMITER"
            | "CREEM_API_URL"
            | "CREEM_API_KEY"
            | "CREEM_SUCCESS_URL"
            | "CREEM_CANCEL_URL"
            | "UPSTASH_REDIS_REST_URL"
            | "UPSTASH_REDIS_REST_TOKEN"
        >;
        const maybeCtx = (
            cfContext as {
                ctx?: { waitUntil?: (promise: Promise<unknown>) => void };
            }
        ).ctx;
        const waitUntil =
            typeof maybeCtx?.waitUntil === "function"
                ? maybeCtx.waitUntil.bind(maybeCtx)
                : undefined;

        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "creem:create-checkout",
            env: {
                RATE_LIMITER: cf.RATE_LIMITER,
                UPSTASH_REDIS_REST_URL: cf.UPSTASH_REDIS_REST_URL,
                UPSTASH_REDIS_REST_TOKEN: cf.UPSTASH_REDIS_REST_TOKEN,
            },
            message: "Too many checkout attempts",
            upstash: {
                strategy: { type: "sliding", requests: 3, window: "10 s" },
                analytics: true,
                prefix: "@ratelimit/checkout",
                includeHeaders: true,
            },
            waitUntil,
        });
        if (!rateLimitResult.ok) {
            return rateLimitResult.response;
        }
        const origin = request.headers.get("origin");
        const body = (await request.json()) as Body;

        // 必要环境变量校验（缺失则直接失败，避免上游 503 混淆）
        if (isEnvMissing(cf)) {
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
        const isSubscription = normalizedType === "subscription";
        const { productId, creditsAmount } = selectProduct(
            { productId: body.productId, tierId: body.tierId },
            isSubscription,
        );
        const allowed = allowedProductIds();

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
                credits: productType === "credits" ? (creditsAmount ?? 0) : 0,
            },
        };
        const { successUrl, cancelUrl } = buildRedirectUrls(cf, origin);
        if (successUrl) requestBody.success_url = successUrl;
        if (cancelUrl) requestBody.cancel_url = cancelUrl;
        if (body.discountCode) requestBody.discount_code = body.discountCode;

        // 涓婃父璇锋眰锛氬鍔犺秴鏃躲€侀噸璇曪紙鎸囨暟閫€閬?+ 鎶栧姩锛変笌閿欒褰掑洜
        const { ok, status, data, text, attempts, contentType } =
            await fetchWithRetry(`${cf.CREEM_API_URL}/checkouts`, {
                method: "POST",
                headers: {
                    "x-api-key": cf.CREEM_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(requestBody),
            });

        if (!ok) {
            const snippet = (text || "").slice(0, 300);
            status === 400 || status === 404 || status === 422;
            const mapped = _mapUpstreamToHttp(status);
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

        const checkoutUrl = _ensureCheckoutUrl(data);
        if (!checkoutUrl) {
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
        // 标准化字段：data.checkoutUrl；附带 meta.raw 便于调试
        const json = data as { checkout_url?: string };
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
                const data = await readResponseBody(resp, isJson);
                return {
                    ok: true,
                    status: resp.status,
                    data,
                    attempts: attempt,
                    contentType: lastContentType || null,
                };
            }

            // 读取文本用于诊断；对 5xx/429 进行重试
            lastText = await resp.text();
            if (isRetryableStatus(resp.status) && attempt < maxAttempts) {
                await sleep(backoffWithJitter(attempt));
                continue;
            }

            return {
                ok: false,
                status: resp.status,
                text: lastText,
                attempts: attempt,
                contentType: lastContentType || null,
            };
        } catch (err) {
            clearTimeout(timer);
            // 缃戠粶/瓒呮椂閿欒锛氶噸璇?
            if (attempt < maxAttempts) {
                await sleep(backoffWithJitter(attempt));
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

function secureRandomInt(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    const g: Crypto | undefined = (globalThis as unknown as { crypto?: Crypto })
        .crypto;
    // 2^32
    const maxUint32 = 0x100000000;
    const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;
    if (g && typeof g.getRandomValues === "function") {
        // browser/recent runtime: use getRandomValues, rejection sampling
        let rand: number;
        do {
            const arr = new Uint32Array(1);
            g.getRandomValues(arr);
            rand = arr[0];
        } while (rand >= limit);
        return rand % maxExclusive;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto =
            require("node:crypto") as typeof import("node:crypto");
        let rand: number;
        do {
            rand = nodeCrypto.randomBytes(4).readUInt32BE(0);
        } while (rand >= limit);
        return rand % maxExclusive;
    } catch {}
    return 0;
}

function backoffWithJitter(attempt: number) {
    const base = Math.min(1000 * 2 ** (attempt - 1), 5000); // 1s, 2s, 4s, capped 5s
    const jitter = secureRandomInt(300);
    return base + jitter;
}
