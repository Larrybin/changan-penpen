import { NextResponse } from "next/server";
import { getDb, siteSettings } from "@/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { resolveAppUrl } from "@/lib/seo";

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
            return { ok: false, error: "R2 binding next_cf_app_bucket missing" };
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
    const [db, r2, envs, appUrl] = await Promise.all([
        checkDb(),
        checkR2(),
        checkEnvAndBindings(),
        checkAppUrl(),
    ]);
    const ok = db.ok && r2.ok && envs.ok && appUrl.ok;

    const body = {
        ok,
        time: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        checks: {
            db,
            r2,
            env: envs,
            appUrl,
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
        const optionalSecrets = [
            "CREEM_API_KEY",
            "CREEM_WEBHOOK_SECRET",
            "CREEM_API_URL",
        ];
        const missing = requiredSecrets.filter((k) => !env?.[k]);
        // Check important bindings presence
        const missingBindings: string[] = [];
        if (!("next_cf_app_bucket" in (env as any))) missingBindings.push("next_cf_app_bucket");
        if (!("AI" in (env as any))) {
            // AI 可选，仅记录为可选缺失，不导致失败
        }
        if (!("ASSETS" in (env as any))) {
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
        let settings: any = undefined;
        if (rows && rows.length) {
            // Map minimal fields used by resolveAppUrl
            settings = { domain: (rows[0] as any)?.domain ?? "" };
        }
        const base = resolveAppUrl(settings as any);
        if (!base) return { ok: false, error: "Failed to resolve app base URL" };
        // Basic shape check
        try {
            const u = new URL(base);
            if (!u.protocol.startsWith("http")) {
                return { ok: false, error: `Invalid protocol in base URL: ${u.protocol}` };
            }
        } catch (e) {
            return { ok: false, error: `Invalid base URL format: ${String(e)}` };
        }
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}
