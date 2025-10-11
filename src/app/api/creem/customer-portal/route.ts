import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { customers } from "@/modules/creem/schemas/billing.schema";

export async function GET(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const db = await getDb();
        const row = await db
            .select({ creemCustomerId: customers.creemCustomerId })
            .from(customers)
            .where(eq(customers.userId, session.user.id))
            .limit(1);
        const creemCustomerId = row[0]?.creemCustomerId;
        if (!creemCustomerId) {
            return new Response("No subscription/customer found", {
                status: 404,
            });
        }

        const { env } = await getCloudflareContext({ async: true });
        const cf = env as unknown as Pick<
            CloudflareEnv,
            "CREEM_API_URL" | "CREEM_API_KEY"
        >;
        if (!cf.CREEM_API_URL || !cf.CREEM_API_KEY) {
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
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Failed to get portal link",
                    meta: { status, upstreamBodySnippet: snippet },
                    data: null,
                }),
                {
                    status: mapped,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const url = _ensurePortalUrl(data);
        if (!url) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid response from Creem: missing portal url",
                    data: null,
                }),
                {
                    status: 502,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
        // 标准化字段：data.portalUrl；附带 meta.raw 便于调试
        // 标准化字段：data.portalUrl；附带 meta.raw 便于调试
        const json = data as { url?: string; portal_url?: string; billing_url?: string };
        const payload = {
            success: true,
            data: { portalUrl: url },
            error: null as string | null,
            meta: { raw: json },
        };
        return new Response(JSON.stringify(payload), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (_error) {
        return new Response("Internal Server Error", { status: 500 });
    }
}

async function fetchWithRetry(
    url: string,
    init: RequestInit,
    options?: { attempts?: number; timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data?: unknown; text?: string }> {
    const maxAttempts = Math.max(1, options?.attempts ?? 3);
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 8000);
    let lastText: string | undefined;
    let lastStatus = 0;
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
            const ct = resp.headers.get("content-type") || "";
            const isJson = ct.toLowerCase().includes("application/json");
            if (resp.ok) {
                const data = await readResponseBody(resp, isJson);
                return { ok: true, status: resp.status, data };
            }
            lastText = await resp.text();
            if (resp.status === 429 || resp.status >= 500) {
                if (attempt < maxAttempts) {
                    await sleep(backoffWithJitter(attempt));
                    continue;
                }
            }
            return { ok: false, status: resp.status, text: lastText };
        } catch (err) {
            clearTimeout(timer);
            if (attempt < maxAttempts) {
                await sleep(backoffWithJitter(attempt));
                continue;
            }
            const msg = err instanceof Error ? err.message : String(err);
            return { ok: false, status: lastStatus || 0, text: msg };
        }
    }
    return { ok: false, status: lastStatus || 0, text: lastText };
}

function secureRandomInt(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    const g: Crypto | undefined = (globalThis as unknown as { crypto?: Crypto })
        .crypto;
    if (g && typeof g.getRandomValues === "function") {
        const arr = new Uint32Array(1);
        g.getRandomValues(arr);
        return arr[0] % maxExclusive;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto =
            require("node:crypto") as typeof import("node:crypto");
        // Remove modulo bias: use rejection sampling
        const range = 0xffffffff + 1;
        const limit = Math.floor(range / maxExclusive) * maxExclusive;
        let rand: number;
        do {
            rand = nodeCrypto.randomBytes(4).readUInt32BE(0);
        } while (rand >= limit);
        return rand % maxExclusive;
    } catch {}
    return 0;
}




function _mapUpstreamToHttp(status: number): number {
    if (status === 401 || status === 403) return 401;
    if (status === 400 || status === 404 || status === 422) return 400;
    return 502;
}

function _ensurePortalUrl(data: unknown): string | undefined {
    const json = data as { url?: string; portal_url?: string; billing_url?: string };
    const url = json?.url || json?.portal_url || json?.billing_url;
    return typeof url === "string" && url ? url : undefined;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

function backoffWithJitter(attempt: number): number {
    return Math.min(5000, 1000 * 2 ** (attempt - 1)) + secureRandomInt(300);
}

function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
}

async function readResponseBody(resp: Response, isJson: boolean): Promise<unknown> {
    if (isJson) return resp.json();
    const txt = await resp.text();
    try {
        return JSON.parse(txt);
    } catch {
        return txt;
    }
}
