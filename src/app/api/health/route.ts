import { NextResponse } from "next/server";
import { getDb, siteSettings } from "@/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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
    const [db, r2] = await Promise.all([checkDb(), checkR2()]);
    const ok = db.ok && r2.ok;

    const body = {
        ok,
        time: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        checks: {
            db,
            r2,
        },
    };

    return NextResponse.json(body, { status: ok ? 200 : 503 });
}

