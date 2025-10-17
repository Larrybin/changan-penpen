import { createHash } from "node:crypto";

import { toNextJsHandler } from "better-auth/next-js";

import { applyRateLimit } from "@/lib/rate-limit";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";

const AUTH_RATE_LIMIT_IDENTIFIER = "auth:flow";

function resolveClientIp(request: Request): string | null {
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

function extractSessionFingerprint(request: Request): string | null {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
        return null;
    }

    const cookie = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("better-auth.session_token="));

    if (!cookie) {
        return null;
    }

    const [, value] = cookie.split("=");
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
        return null;
    }

    return createHash("sha256").update(trimmedValue).digest("hex");
}

function resolveAuthRateLimitKeyParts(
    request: Request,
    phase: "callback" | "exchange",
): string[] {
    const parts = [AUTH_RATE_LIMIT_IDENTIFIER, phase];

    const ip = resolveClientIp(request);
    if (ip) {
        parts.push(`ip:${ip}`);
        return parts;
    }

    const session = extractSessionFingerprint(request);
    if (session) {
        parts.push(`session:${session}`);
    }

    return parts;
}

async function enforceAuthRateLimit(
    request: Request,
    phase: "callback" | "exchange",
) {
    const keyParts = resolveAuthRateLimitKeyParts(request, phase);
    try {
        const rateLimitResult = await applyRateLimit({
            request,
            identifier: AUTH_RATE_LIMIT_IDENTIFIER,
            keyParts,
            message: "Too many authentication attempts",
            upstash: {
                strategy: { type: "sliding", requests: 10, window: "60 s" },
                prefix: "@ratelimit/auth",
                analytics: true,
                includeHeaders: true,
            },
        });
        if (!rateLimitResult.ok) {
            return rateLimitResult.response;
        }
    } catch (error) {
        console.warn("[auth] rate limit enforcement failed", error);
    }
    return null;
}

// Create a dynamic handler that gets the auth instance
const createHandler = async () => {
    const auth = await getAuthInstance();
    return toNextJsHandler(auth.handler);
};

// Export the handlers
export async function GET(request: Request) {
    const limited = await enforceAuthRateLimit(request, "callback");
    if (limited) {
        return limited;
    }
    const { GET: handler } = await createHandler();
    return handler(request);
}

export async function POST(request: Request) {
    const limited = await enforceAuthRateLimit(request, "exchange");
    if (limited) {
        return limited;
    }
    const { POST: handler } = await createHandler();
    return handler(request);
}
