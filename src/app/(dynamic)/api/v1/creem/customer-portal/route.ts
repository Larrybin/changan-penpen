import { getCloudflareContext } from "@opennextjs/cloudflare";
import handleApiError from "@/lib/api-error";
import { json } from "@/lib/http";
import { createApiErrorResponse } from "@/lib/http-error";
import { secureRandomInt } from "@/lib/random";
import { requireSessionUser } from "@/modules/auth/utils/guards";
import { requireCreemCustomerId } from "@/modules/creem/utils/guards";

function requireCreemEnv(
    cf: Pick<CloudflareEnv, "CREEM_API_URL" | "CREEM_API_KEY">,
):
    | { ok: true; cf: Pick<CloudflareEnv, "CREEM_API_URL" | "CREEM_API_KEY"> }
    | { ok: false; response: Response } {
    if (!cf.CREEM_API_URL || !cf.CREEM_API_KEY) {
        return {
            ok: false,
            response: createApiErrorResponse({
                status: 503,
                code: "SERVICE_UNAVAILABLE",
                message: "Missing CREEM_API_URL or CREEM_API_KEY",
                severity: "high",
            }),
        };
    }
    return { ok: true, cf };
}

function _mapUpstreamToHttp(status: number): number {
    if (status === 401 || status === 403) return 401;
    if (status === 400 || status === 404 || status === 422) return 400;
    return 502;
}

function _ensurePortalUrl(data: unknown): string | undefined {
    const jsonObj = data as {
        url?: string;
        portal_url?: string;
        billing_url?: string;
    };
    const url = jsonObj?.url || jsonObj?.portal_url || jsonObj?.billing_url;
    return typeof url === "string" && url ? url : undefined;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

type FetchAttemptResult =
    | { kind: "success"; status: number; data: unknown }
    | { kind: "failure"; status: number; text?: string; shouldRetry: boolean };

function backoffWithJitter(attempt: number): number {
    return Math.min(5000, 1000 * 2 ** (attempt - 1)) + secureRandomInt(300);
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

export async function GET(request: Request) {
    try {
        // 直线式 Guard：失败立即返回 Response
        const userIdOrResp = await requireSessionUser(request);
        if (userIdOrResp instanceof Response) return userIdOrResp;
        const userId = userIdOrResp;

        const customerIdOrResp = await requireCreemCustomerId(userId);
        if (customerIdOrResp instanceof Response) return customerIdOrResp;
        const creemCustomerId = customerIdOrResp;

        const { env } = await getCloudflareContext({ async: true });
        const envPick = env as unknown as Pick<
            CloudflareEnv,
            "CREEM_API_URL" | "CREEM_API_KEY"
        >;
        const envRes = requireCreemEnv(envPick);
        if (!("ok" in envRes) || envRes.ok === false) return envRes.response;
        const cf = envRes.cf;

        const { ok, status, text, data } = await fetchWithRetry(
            `${cf.CREEM_API_URL}/customers/billing`,
            {
                method: "POST",
                headers: {
                    "x-api-key": cf.CREEM_API_KEY,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ customer_id: creemCustomerId }),
            },
        );
        if (!ok) {
            const snippet = (text || "").slice(0, 300);
            const mapped = _mapUpstreamToHttp(status);
            return createApiErrorResponse({
                status: mapped,
                code: "UPSTREAM_FAILURE",
                message: "Failed to get portal link",
                details: {
                    status,
                    upstreamBodySnippet: snippet,
                },
                severity: mapped >= 500 ? "high" : "medium",
            });
        }

        const url = _ensurePortalUrl(data);
        if (!url) {
            return createApiErrorResponse({
                status: 502,
                code: "UPSTREAM_INVALID_RESPONSE",
                message: "Invalid response from Creem: missing portal url",
                severity: "high",
            });
        }
        // 标准化字段：data.portalUrl
        const payload = {
            success: true,
            data: { portalUrl: url },
            error: null as string | null,
        };
        return json(200, payload);
    } catch (error) {
        console.error("[api/creem/customer-portal] error", error);
        return handleApiError(error);
    }
}

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
        const ct = resp.headers.get("content-type") || "";
        const isJson = ct.toLowerCase().includes("application/json");
        if (resp.ok) {
            const data = await readResponseBody(resp, isJson);
            return { kind: "success", status: resp.status, data };
        }
        const text = await resp.text();
        return {
            kind: "failure",
            status: resp.status,
            text,
            shouldRetry: isRetryableStatus(resp.status),
        };
    } catch (error) {
        clearTimeout(timer);
        const message = error instanceof Error ? error.message : String(error);
        return { kind: "failure", status: 0, text: message, shouldRetry: true };
    }
}

async function fetchWithRetry(
    url: string,
    init: RequestInit,
    options?: { attempts?: number; timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data?: unknown; text?: string }> {
    const maxAttempts = Math.max(1, options?.attempts ?? 3);
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 8000);

    let lastFailure: { status: number; text?: string } = {
        status: 0,
        text: undefined,
    };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await performFetchAttempt(url, init, timeoutMs);
        if (result.kind === "success") {
            return { ok: true, status: result.status, data: result.data };
        }
        lastFailure = { status: result.status, text: result.text };
        const shouldRetry = result.shouldRetry && attempt < maxAttempts;
        if (!shouldRetry) {
            return {
                ok: false,
                status: lastFailure.status,
                text: lastFailure.text,
            };
        }
        await sleep(backoffWithJitter(attempt));
    }

    return { ok: false, status: lastFailure.status, text: lastFailure.text };
}
