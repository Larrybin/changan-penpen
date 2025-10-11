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
            const isAuthErr = status === 401 || status === 403;
            const isClientErr =
                status === 400 || status === 404 || status === 422;
            const mapped = isAuthErr ? 401 : isClientErr ? 400 : 502;
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

        type BillingPortalResponse = {
            url?: string;
            portal_url?: string;
            billing_url?: string;
        };
        const json = data as BillingPortalResponse;
        const url = json?.url || json?.portal_url || json?.billing_url;
        if (!url || typeof url !== "string") {
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
        // 标准化字段：data.portalUrl；附带 meta.raw 便于调试（已移除 legacy 字段）
        const payload = {
            success: true,
            data: { portalUrl: url },
            error: null as string | null,
            meta: { raw: json },
        };
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
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
                const data = isJson ? await resp.json() : await resp.text();
                return { ok: true, status: resp.status, data };
            }
            const txt = await resp.text();
            lastText = txt;
            if (resp.status === 429 || resp.status >= 500) {
                if (attempt < maxAttempts) {
                    await new Promise((r) =>
                        setTimeout(
                            r,
                            Math.min(5000, 1000 * 2 ** (attempt - 1)) +
                                secureRandomInt(300),
                        ),
                    );
                    continue;
                }
            }
            return { ok: false, status: resp.status, text: txt };
        } catch (err) {
            clearTimeout(timer);
            if (attempt < maxAttempts) {
                await new Promise((r) =>
                    setTimeout(
                        r,
                        Math.min(5000, 1000 * 2 ** (attempt - 1)) +
                            secureRandomInt(300),
                    ),
                );
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
