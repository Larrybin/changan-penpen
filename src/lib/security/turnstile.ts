import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";

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

async function resolveForwardedIp(): Promise<string | null> {
    try {
        const requestHeaders = await headers();
        const forwarded =
            requestHeaders.get("cf-connecting-ip") ??
            requestHeaders.get("x-forwarded-for");
        if (!forwarded) {
            return null;
        }
        const [first] = forwarded.split(",");
        const ip = first?.trim();
        return ip && ip.length > 0 ? ip : null;
    } catch {
        return null;
    }
}

export async function verifyTurnstileToken(
    token: string | null | undefined,
): Promise<TurnstileVerificationResult> {
    if (!token || token.trim().length === 0) {
        return { success: false, error: "missing-token" };
    }

    let env: TurnstileEnv | undefined;
    try {
        const context = getCloudflareContext();
        env = context.env as TurnstileEnv | undefined;
    } catch (error) {
        logger.error(
            "Failed to access Cloudflare context for Turnstile verification",
            {
                error: error instanceof Error ? error.message : "unknown-error",
            },
        );
        return { success: false, error: "request-failed" };
    }

    const secret = env?.TURNSTILE_SECRET;
    if (!secret) {
        logger.error(
            "TURNSTILE_SECRET is not configured; cannot verify Turnstile token",
        );
        return { success: false, error: "missing-secret" };
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);

    const forwardedIp = await resolveForwardedIp();
    if (forwardedIp) {
        body.set("remoteip", forwardedIp);
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
