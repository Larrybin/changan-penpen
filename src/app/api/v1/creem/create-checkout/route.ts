import { getCloudflareContext } from "@opennextjs/cloudflare";
import handleApiError from "@/lib/api-error";
import { ApiError } from "@/lib/http-error";
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
    requestId?: string;
    units?: number;
};

const REQUEST_ID_REGEX = /^[A-Za-z0-9:_-]{8,128}$/;

type CheckoutEnv = Pick<
    CloudflareEnv,
    | "RATE_LIMITER"
    | "CREEM_API_URL"
    | "CREEM_API_KEY"
    | "CREEM_SUCCESS_URL"
    | "CREEM_CANCEL_URL"
    | "UPSTASH_REDIS_REST_URL"
    | "UPSTASH_REDIS_REST_TOKEN"
>;

type AuthSession = {
    user?: {
        id: string;
        email?: string | null;
    } | null;
};

type SessionUser = {
    id: string;
    email: string;
};

type CheckoutRequestBody = {
    product_id: string;
    customer: { email: string };
    metadata: {
        user_id: string;
        product_type: "subscription" | "credits";
        credits: number;
        request_id?: string;
        units?: number;
    };
    success_url?: string;
    cancel_url?: string;
    discount_code?: string;
    request_id?: string;
    units?: number;
};

function normalizeRequestId(input: unknown): string | undefined {
    if (typeof input !== "string") {
        return undefined;
    }
    const value = input.trim();
    if (!value) {
        return undefined;
    }
    if (!REQUEST_ID_REGEX.test(value)) {
        throw new ApiError("Invalid requestId format", {
            status: 400,
            code: "INVALID_REQUEST",
            severity: "medium",
            details: { requestId: value },
        });
    }
    return value;
}

function normalizeUnits(input: unknown): number | undefined {
    if (input === null || input === undefined) {
        return undefined;
    }
    const candidate =
        typeof input === "string" ? Number.parseInt(input, 10) : input;
    if (!Number.isFinite(candidate)) {
        throw new ApiError("Invalid units value", {
            status: 400,
            code: "INVALID_REQUEST",
            severity: "medium",
            details: { units: input },
        });
    }
    const normalized = Number(candidate);
    if (!Number.isInteger(normalized) || normalized <= 0 || normalized > 1000) {
        throw new ApiError("Units must be a positive integer up to 1000", {
            status: 400,
            code: "INVALID_REQUEST",
            severity: "medium",
            details: { units: normalized },
        });
    }
    return normalized;
}

function generateRequestId(): string {
    try {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }
    } catch {
        // Ignore: browser crypto not available in this environment
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto =
            require("node:crypto") as typeof import("node:crypto");
        if (typeof nodeCrypto.randomUUID === "function") {
            return nodeCrypto.randomUUID();
        }
    } catch {
        // Ignore: node crypto fallback not available
    }
    return `req_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

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

type FetchAttemptResult =
    | {
          kind: "success";
          status: number;
          data: unknown;
          contentType: string | null;
      }
    | {
          kind: "failure";
          status: number;
          text?: string;
          contentType: string | null;
          shouldRetry: boolean;
      };

async function resolveCheckoutContext(request: Request): Promise<{
    env: CheckoutEnv;
    waitUntil?: (promise: Promise<unknown>) => void;
    origin: string | null;
}> {
    const cfContext = await getCloudflareContext({ async: true });
    const env = cfContext.env as unknown as CheckoutEnv;
    const maybeCtx = (
        cfContext as {
            ctx?: { waitUntil?: (promise: Promise<unknown>) => void };
        }
    ).ctx;
    const waitUntil =
        typeof maybeCtx?.waitUntil === "function"
            ? maybeCtx.waitUntil.bind(maybeCtx)
            : undefined;

    return {
        env,
        waitUntil,
        origin: request.headers.get("origin"),
    };
}

async function requireSessionUser(request: Request): Promise<SessionUser> {
    const auth = await getAuthInstance();
    const session = (await auth.api.getSession({
        headers: request.headers,
    })) as AuthSession;
    const user = session?.user;
    if (!user) {
        throw new ApiError("Authentication required", {
            status: 401,
            code: "UNAUTHORIZED",
            severity: "high",
        });
    }

    const email = user.email;
    if (!email) {
        throw new ApiError("User email required", {
            status: 400,
            code: "INVALID_REQUEST",
            severity: "medium",
        });
    }

    return { id: user.id, email };
}

async function enforceCheckoutRateLimit(
    request: Request,
    env: CheckoutEnv,
    waitUntil?: (promise: Promise<unknown>) => void,
): Promise<Response | undefined> {
    const rateLimitResult = await applyRateLimit({
        request,
        identifier: "creem:create-checkout",
        env: {
            RATE_LIMITER: env.RATE_LIMITER,
            UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
            UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
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

    return rateLimitResult.ok ? undefined : rateLimitResult.response;
}

function createCheckoutRequestPayload(options: {
    body: Body;
    user: SessionUser;
    env: CheckoutEnv;
    origin: string | null;
}): {
    requestBody: CheckoutRequestBody;
    productId: string;
    productType: "subscription" | "credits";
    requestId: string;
    units?: number;
} {
    if (isEnvMissing(options.env)) {
        throw new ApiError("Missing CREEM_API_URL or CREEM_API_KEY", {
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            severity: "high",
        });
    }

    const normalizedType = (options.body.productType || "").toLowerCase();
    const isSubscription = normalizedType === "subscription";
    const { productId, creditsAmount } = selectProduct(
        { productId: options.body.productId, tierId: options.body.tierId },
        isSubscription,
    );
    const allowed = allowedProductIds();

    if (!productId || !allowed.has(productId)) {
        throw new ApiError("Invalid or missing productId/tierId", {
            status: 400,
            code: "INVALID_REQUEST",
            details: {
                productId,
                tierId: options.body.tierId ?? null,
            },
            severity: "medium",
        });
    }

    const productType: "subscription" | "credits" = isSubscription
        ? "subscription"
        : "credits";
    const requestId =
        normalizeRequestId(options.body.requestId) ?? generateRequestId();
    const units = normalizeUnits(options.body.units);

    const requestBody: CheckoutRequestBody = {
        product_id: productId,
        customer: { email: options.user.email },
        metadata: {
            user_id: options.user.id,
            product_type: productType,
            credits: productType === "credits" ? (creditsAmount ?? 0) : 0,
        },
    };
    requestBody.metadata.request_id = requestId;
    requestBody.request_id = requestId;

    const { successUrl, cancelUrl } = buildRedirectUrls(
        options.env,
        options.origin,
    );
    if (successUrl) requestBody.success_url = successUrl;
    if (cancelUrl) requestBody.cancel_url = cancelUrl;
    if (options.body.discountCode) {
        requestBody.discount_code = options.body.discountCode;
    }
    if (typeof units === "number") {
        requestBody.units = units;
        requestBody.metadata.units = units;
    }

    return { requestBody, productId, productType, requestId, units };
}

async function sendCheckoutRequest(
    env: CheckoutEnv,
    requestBody: CheckoutRequestBody,
): Promise<{ checkoutUrl: string; raw: unknown }> {
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
        const isClientError =
            status === 400 || status === 404 || status === 422;
        const errorMessage = isClientError
            ? "Create checkout failed due to invalid request"
            : "Create checkout failed";
        const mapped = _mapUpstreamToHttp(status);
        throw new ApiError(errorMessage, {
            status: mapped,
            code: isClientError ? "UPSTREAM_BAD_REQUEST" : "UPSTREAM_FAILURE",
            details: {
                status,
                attempts,
                contentType: contentType || null,
                upstreamBodySnippet: snippet,
                isClientError,
            },
            severity: isClientError ? "medium" : "high",
        });
    }

    const checkoutUrl = _ensureCheckoutUrl(data);
    if (!checkoutUrl) {
        throw new ApiError(
            "Invalid response from Creem: missing checkout_url",
            {
                status: 502,
                code: "UPSTREAM_INVALID_RESPONSE",
                details: { data },
                severity: "high",
            },
        );
    }

    return { checkoutUrl, raw: data };
}

function buildCheckoutSuccessResponse(options: {
    checkoutUrl: string;
    raw: unknown;
    requestId: string;
}): Response {
    return new Response(
        JSON.stringify({
            success: true,
            data: { checkoutUrl: options.checkoutUrl },
            error: null,
            meta: { raw: options.raw, requestId: options.requestId },
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        },
    );
}

export async function POST(request: Request) {
    try {
        const user = await requireSessionUser(request);
        const context = await resolveCheckoutContext(request);
        const rateLimitResponse = await enforceCheckoutRateLimit(
            request,
            context.env,
            context.waitUntil,
        );
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const body = (await request.json()) as Body;
        const { requestBody, productId, productType, requestId, units } =
            createCheckoutRequestPayload({
                body,
                user,
                env: context.env,
                origin: context.origin,
            });

        console.info("[api/creem/create-checkout] creating checkout", {
            requestId,
            userId: user.id,
            productId,
            productType,
            units: units ?? null,
        });

        // 涓婃父璇锋眰锛氬鍔犺秴鏃躲€侀噸璇曪紙鎸囨暟閫€閬?+ 鎶栧姩锛変笌閿欒褰掑洜
        const { checkoutUrl, raw } = await sendCheckoutRequest(
            context.env,
            requestBody,
        );

        return buildCheckoutSuccessResponse({
            checkoutUrl,
            raw,
            requestId,
        });
    } catch (error) {
        console.error("[api/creem/create-checkout] error", error);
        return handleApiError(error);
    }
}

// 内部：带超时与重试的 fetch（针对 Workers 环境）
async function performFetchAttempt(
    url: string,
    init: RequestInit,
    timeoutMs: number,
): Promise<FetchAttemptResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const resp = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);

        const contentType = resp.headers.get("content-type") || null;
        const isJson = (contentType || "")
            .toLowerCase()
            .includes("application/json");

        if (resp.ok) {
            const data = await readResponseBody(resp, isJson);
            return {
                kind: "success",
                status: resp.status,
                data,
                contentType,
            };
        }

        const text = await resp.text();
        return {
            kind: "failure",
            status: resp.status,
            text,
            contentType,
            shouldRetry: isRetryableStatus(resp.status),
        };
    } catch (error) {
        clearTimeout(timer);
        const message = error instanceof Error ? error.message : String(error);
        return {
            kind: "failure",
            status: 0,
            text: message,
            contentType: null,
            shouldRetry: true,
        };
    }
}

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

    let lastFailure: {
        status: number;
        text?: string;
        contentType: string | null;
    } = {
        status: 0,
        text: undefined,
        contentType: null,
    };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await performFetchAttempt(url, init, timeoutMs);

        if (result.kind === "success") {
            return {
                ok: true,
                status: result.status,
                data: result.data,
                attempts: attempt,
                contentType: result.contentType,
            };
        }

        lastFailure = {
            status: result.status,
            text: result.text,
            contentType: result.contentType,
        };

        const shouldRetry = result.shouldRetry && attempt < maxAttempts;
        if (!shouldRetry) {
            return {
                ok: false,
                status: lastFailure.status,
                text: lastFailure.text,
                attempts: attempt,
                contentType: lastFailure.contentType,
            };
        }

        await sleep(backoffWithJitter(attempt));
    }

    return {
        ok: false,
        status: lastFailure.status,
        text: lastFailure.text,
        attempts: maxAttempts,
        contentType: lastFailure.contentType,
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
    } catch {
        // Ignore: unable to access Node.js crypto in this environment
    }
    return 0;
}

function backoffWithJitter(attempt: number) {
    const base = Math.min(1000 * 2 ** (attempt - 1), 5000); // 1s, 2s, 4s, capped 5s
    const jitter = secureRandomInt(300);
    return base + jitter;
}
