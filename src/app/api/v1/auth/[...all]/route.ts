import { toNextJsHandler } from "better-auth/next-js";

import { applyRateLimit } from "@/lib/rate-limit";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";

async function enforceAuthRateLimit(
    request: Request,
    phase: "callback" | "exchange",
) {
    try {
        const rateLimitResult = await applyRateLimit({
            request,
            identifier: "auth:flow",
            keyParts: [phase],
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
