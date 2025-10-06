import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDb, siteSettings } from "@/db";
import { resolveAppUrl } from "@/lib/seo";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

export const runtime = "edge";

type CheckResult = { ok: true } | { ok: false; error: string };

async function checkDb(): Promise<CheckResult> {
    try {
        const db = await getDb();
        // Run a lightweight query to verify connectivity
        await db.select().from(siteSettings).limit(1);
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkR2(): Promise<CheckResult> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        // Ensure binding exists
        if (!env || !("next_cf_app_bucket" in env)) {
            return {
                ok: false,
                error: "R2 binding next_cf_app_bucket missing",
            };
        }
        // List with small limit to validate access
        // @ts-expect-error - R2Bucket types are provided at runtime by Cloudflare
        await env.next_cf_app_bucket.list({ limit: 1 });
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

export async function GET() {
    const startedAt = Date.now();
    const [db, r2, envs, appUrl, external] = await Promise.all([
        checkDb(),
        checkR2(),
        checkEnvAndBindings(),
        checkAppUrl(),
        checkExternalServices(),
    ]);
    // 外部依赖是否为强制项由开关控制（默认不阻断）
    const { env } = await getCloudflareContext({ async: true });
    const requireExternal =
        String(env?.HEALTH_REQUIRE_EXTERNAL ?? "false") === "true";
    const ok =
        db.ok &&
        r2.ok &&
        envs.ok &&
        appUrl.ok &&
        (!requireExternal || external.ok);

    const body = {
        ok,
        time: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        checks: {
            db,
            r2,
            env: envs,
            appUrl,
            external,
        },
    } as const;

    return NextResponse.json(body, { status: ok ? 200 : 503 });
}

async function checkEnvAndBindings(): Promise<CheckResult> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const requiredSecrets = [
            "BETTER_AUTH_SECRET",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "CLOUDFLARE_R2_URL",
        ];
        const missing = requiredSecrets.filter((k) => !env?.[k]);
        // Check important bindings presence
        const missingBindings: string[] = [];
        if (!env?.next_cf_app_bucket) {
            missingBindings.push("next_cf_app_bucket");
        }
        if (!env?.AI) {
            // AI 可选，仅记录为可选缺失，不导致失败
        }
        if (!env?.ASSETS) {
            // ASSETS 由 OpenNext Workers 绑定，缺失可能是构建/配置异常
            // 仅在缺失时标记但不阻断（某些配置可能不直接暴露）
        }
        if (missing.length || missingBindings.length) {
            return {
                ok: false,
                error: `Missing env: ${missing.join(",")} | Missing bindings: ${missingBindings.join(",")}`,
            };
        }
        // Optional secrets presence is informative but non-blocking
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkAppUrl(): Promise<CheckResult> {
    try {
        // Ensure we can resolve a valid base URL from settings/env
        const db = await getDb();
        const rows = await db.select().from(siteSettings).limit(1);
        const domain = rows?.[0]?.domain ?? "";
        const settings = domain
            ? ({ domain } as SiteSettingsPayload)
            : undefined;
        const base = resolveAppUrl(settings);
        if (!base) {
            return { ok: false, error: "Failed to resolve app base URL" };
        }
        // Basic shape check
        try {
            const u = new URL(base);
            if (!u.protocol.startsWith("http")) {
                return {
                    ok: false,
                    error: `Invalid protocol in base URL: ${u.protocol}`,
                };
            }
        } catch (e) {
            return {
                ok: false,
                error: `Invalid base URL format: ${String(e)}`,
            };
        }
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkExternalServices(): Promise<CheckResult> {
    try {
        const { env } = await getCloudflareContext({ async: true });
        const base = String(env?.CREEM_API_URL ?? "").trim();
        if (!base) {
            // 未配置则跳过，不阻断
            return { ok: true };
        }
        const bearer = String(env?.CREEM_API_KEY ?? "").trim();
        const headers: Record<string, string> = {};
        if (bearer) headers.authorization = `Bearer ${bearer}`;

        const endpointBase = base.replace(/\/+$/, "");
        const candidates = ["/status", ""]; // 优先尝试 /status，其次根路径

        const timeoutMs = 4000;
        const tryFetch = async (url: string, method: "HEAD" | "GET") => {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method,
                    headers,
                    signal: controller.signal,
                });
                return res;
            } finally {
                clearTimeout(id);
            }
        };

        for (const suffix of candidates) {
            const url = `${endpointBase}${suffix}`;
            try {
                let res = await tryFetch(url, "HEAD");
                if (res.status === 405 || res.status === 404) {
                    res = await tryFetch(url, "GET");
                }
                // 将 2xx/3xx/401/403 视为连通；5xx 视为失败
                if (res.status < 500) {
                    return { ok: true };
                }
            } catch (_error) {
                // 继续尝试下一个候选
            }
        }

        return { ok: false, error: "External service unreachable or 5xx" };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}
