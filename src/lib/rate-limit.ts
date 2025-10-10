import { getCloudflareContext } from "@opennextjs/cloudflare";

interface RateLimitBinding {
    limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface ApplyRateLimitOptions {
    request: Request;
    identifier: string;
    uniqueToken?: string | null;
    env?: { RATE_LIMITER?: RateLimitBinding };
    message?: string;
}

export type ApplyRateLimitResult =
    | { ok: true; skipped: boolean }
    | { ok: false; response: Response };

function getClientIp(request: Request): string | null {
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    const trimmedCfConnectingIp = cfConnectingIp?.trim();
    if (trimmedCfConnectingIp) {
        return trimmedCfConnectingIp;
    }

    const xForwardedFor = request.headers.get("x-forwarded-for");
    const trimmedXForwardedFor = xForwardedFor?.trim();
    if (trimmedXForwardedFor) {
        const first = trimmedXForwardedFor.split(",")[0];
        if (first) {
            return first.trim();
        }
    }

    const realIp = request.headers.get("x-real-ip");
    const trimmedRealIp = realIp?.trim();
    if (trimmedRealIp) {
        return trimmedRealIp;
    }

    return null;
}

export async function applyRateLimit(
    options: ApplyRateLimitOptions,
): Promise<ApplyRateLimitResult> {
    const { request, identifier, uniqueToken, message } = options;

    const providedEnv = options.env;
    const env =
        providedEnv || (await getCloudflareContext({ async: true })).env;
    const rateLimiter = env?.RATE_LIMITER;

    if (!rateLimiter || typeof rateLimiter.limit !== "function") {
        return { ok: true, skipped: true };
    }

    const clientIp = getClientIp(request);
    const keyParts = [identifier];
    if (uniqueToken && uniqueToken.trim().length > 0) {
        keyParts.push(uniqueToken.trim());
    }
    if (clientIp) {
        keyParts.push(clientIp);
    }

    const compositeKey = keyParts.join(":");
    try {
        const outcome = await rateLimiter.limit({ key: compositeKey });
        if (outcome.success) {
            return { ok: true, skipped: false };
        }
    } catch (error) {
        console.warn("[rate-limit] failed to evaluate", {
            key: compositeKey,
            error,
        });
        return { ok: true, skipped: true };
    }

    const responseBody = {
        success: false,
        error: message || "Too many requests",
        data: null,
    };

    return {
        ok: false,
        response: new Response(JSON.stringify(responseBody), {
            status: 429,
            headers: { "Content-Type": "application/json" },
        }),
    };
}
