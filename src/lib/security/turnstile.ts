import { getCloudflareContext } from "@opennextjs/cloudflare";

import { createLogger } from "@/lib/observability/logger";

type TurnstileEnv = {
    TURNSTILE_SECRET?: string;
};

const TURNSTILE_VERIFY_ENDPOINT =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify" as const;

export type TurnstileVerificationError =
    | "missing-token"
    | "missing-secret"
    | "verification-failed"
    | "request-failed";

export interface TurnstileVerificationResult {
    success: boolean;
    error?: TurnstileVerificationError;
    errorCodes?: string[];
}

const logger = createLogger({ source: "security.turnstile" });

export async function verifyTurnstileToken(
    token: string | null | undefined,
): Promise<TurnstileVerificationResult> {
    if (!token || token.trim().length === 0) {
        return { success: false, error: "missing-token" };
    }

    let env: TurnstileEnv | undefined;
    let request: Request | undefined;
    try {
        const context = getCloudflareContext();
        env = context.env as TurnstileEnv | undefined;
        request = context.request;
    } catch (error) {
        logger.error("Failed to access Cloudflare context for Turnstile verification", {
            error: error instanceof Error ? error.message : "unknown-error",
        });
        return { success: false, error: "request-failed" };
    }

    const secret = env?.TURNSTILE_SECRET;
    if (!secret) {
        logger.error("TURNSTILE_SECRET is not configured; cannot verify Turnstile token");
        return { success: false, error: "missing-secret" };
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);

    const forwarded = request?.headers.get("cf-connecting-ip")
        ?? request?.headers.get("x-forwarded-for");
    if (forwarded) {
        const ip = forwarded.split(",")[0]?.trim();
        if (ip) {
            body.set("remoteip", ip);
        }
    }

    try {
        const response = await fetch(TURNSTILE_VERIFY_ENDPOINT, {
            method: "POST",
            body,
        });

        if (!response.ok) {
            logger.warn("Turnstile verification returned non-success status", {
                status: response.status,
                statusText: response.statusText,
            });
            return { success: false, error: "request-failed" };
        }

        const result = (await response.json()) as {
            success: boolean;
            "error-codes"?: string[];
        };

        if (!result.success) {
            logger.warn("Turnstile verification failed", {
                errorCodes: result["error-codes"],
            });
            return {
                success: false,
                error: "verification-failed",
                errorCodes: result["error-codes"],
            };
        }

        return { success: true };
    } catch (error) {
        logger.error("Turnstile verification request failed", {
            error: error instanceof Error ? error.message : "unknown-error",
        });
        return { success: false, error: "request-failed" };
    }
}
