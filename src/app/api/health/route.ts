import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDb, siteSettings } from "@/db";
import { resolveAppUrl } from "@/lib/seo";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

// 缁熶竴锛氬湪 Cloudflare Workers 涓婅繍琛岋紝浣跨敤 edge 杩愯鏃朵互渚跨嫭绔嬫墦鍖?export const runtime = "nodejs";

type CheckResult = { ok: true } | { ok: false; error: string };

type CloudflareBindings = Awaited<
    ReturnType<typeof getCloudflareContext>
>["env"];

function extractAccessToken(headers: Headers): string {
    const tokenHeader = headers.get("x-health-token");
    if (tokenHeader && tokenHeader.trim().length > 0) {
        return tokenHeader.trim();
    }
    const authorization = headers.get("authorization");
    if (!authorization) {
        return "";
    }
    const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) {
        return bearerMatch[1]?.trim() ?? "";
    }
    return authorization.trim();
}

async function checkDb(): Promise<CheckResult> {
    try {
        const db = await getDb();
        // 鎵ц杞婚噺鏌ヨ浠ラ獙璇佽繛閫氭€?        await db.select().from(siteSettings).limit(1);
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkR2(env: CloudflareBindings): Promise<CheckResult> {
    try {
        // 纭缁戝畾瀛樺湪
        if (!env || !("next_cf_app_bucket" in env)) {
            return {
                ok: false,
                error: "R2 binding next_cf_app_bucket missing",
            };
        }
        // 鍒楄〃璇锋眰锛坙imit=1锛夐獙璇佸彲璁块棶鎬?        await (env as unknown as CloudflareEnv).next_cf_app_bucket.list({
            limit: 1,
        });
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

export async function GET(request: Request) {
    const startedAt = Date.now();
    const urlObj = new URL(request.url);
    const fast = (() => {
        const v = (
            urlObj.searchParams.get("fast") ||
            urlObj.searchParams.get("mode") ||
            ""
        ).toLowerCase();
        return v === "1" || v === "true" || v === "fast";
    })();
    const reqOrigin = (() => {
        try {
            return new URL(request.url).origin;
        } catch {
            return "";
        }
    })();
    const { env } = await getCloudflareContext({ async: true });
    const envRecord = env as unknown as Record<string, unknown>;
    const configuredToken = String(envRecord.HEALTH_ACCESS_TOKEN ?? "").trim();
    const providedToken = extractAccessToken(request.headers);
    const envMode = String(envRecord.NEXTJS_ENV ?? "").toLowerCase();
    const allowDetails = configuredToken
        ? providedToken === configuredToken
        : envMode !== "production";

    const [db, r2, envs, appUrl, external] = await Promise.all([
        fast ? Promise.resolve<CheckResult>({ ok: true }) : checkDb(),
        checkR2(env),
        checkEnvAndBindings(env, { includeDetails: allowDetails }),
        checkAppUrl({
            runtimeOrigin: reqOrigin,
            env,
            includeDetails: allowDetails,
        }),
        fast
            ? Promise.resolve<CheckResult>({ ok: true })
            : checkExternalServices(env),
    ]);
    // 澶栭儴渚濊禆鏄惁涓哄己鍒堕」鐢卞紑鍏虫帶鍒讹紙榛樿涓嶉樆鏂級
    const requireExternal = fast
        ? false
        : String(
              (envRecord.HEALTH_REQUIRE_EXTERNAL as string | undefined) ??
                  "false",
          ) === "true";
    const requireDb = fast
        ? false
        : String(
              (envRecord.HEALTH_REQUIRE_DB as string | undefined) ?? "false",
          ) === "true";
    const requireR2 = fast
        ? false
        : String(
              (envRecord.HEALTH_REQUIRE_R2 as string | undefined) ?? "false",
          ) === "true";
    const dbHealthy = allowDetails ? !requireDb || db.ok : db.ok;
    const r2Healthy = allowDetails ? !requireR2 || r2.ok : r2.ok;
    const externalHealthy = allowDetails
        ? !requireExternal || external.ok
        : external.ok;
    const ok =
        dbHealthy && r2Healthy && envs.ok && appUrl.ok && externalHealthy;

    const checks = allowDetails
        ? {
              db,
              r2,
              env: envs,
              appUrl,
              external,
          }
        : {
              db: { ok: db.ok },
              r2: { ok: r2.ok },
              env: { ok: envs.ok },
              appUrl: { ok: appUrl.ok },
              external: { ok: external.ok },
          };

    const body = {
        ok,
        time: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        mode: fast ? "fast" : "strict",
        detailLevel: allowDetails ? "full" : "summary",
        checks,
    } as const;

    if (!allowDetails && !ok) {
        return NextResponse.json(
            {
                ...body,
                message:
                    "One or more checks failed. Provide X-Health-Token for diagnostic details.",
            },
            { status: 503 },
        );
    }

    return NextResponse.json(body, { status: ok ? 200 : 503 });
}

async function checkEnvAndBindings(
    env: CloudflareBindings,
    options: { includeDetails: boolean },
): Promise<CheckResult> {
    try {
        const envRecord = env as unknown as Record<string, unknown>;
        const requiredSecrets = ["BETTER_AUTH_SECRET", "CLOUDFLARE_R2_URL"];
        const missing = requiredSecrets.filter((k) => !envRecord?.[k]);
        const googleClientId = String(envRecord?.GOOGLE_CLIENT_ID ?? "").trim();
        const googleClientSecret = String(
            envRecord?.GOOGLE_CLIENT_SECRET ?? "",
        ).trim();
        if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
            return {
                ok: false,
                error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET must both be set to enable Google OAuth",
            };
        }
        // 妫€鏌ュ叧閿粦瀹氭槸鍚﹀瓨鍦?        const missingBindings: string[] = [];
        if (!env?.next_cf_app_bucket) {
            missingBindings.push("next_cf_app_bucket");
        }
        if (!env?.AI) {
            // AI 涓哄彲閫夛紝浠呰褰曠己澶憋紝涓嶄綔涓哄け璐ユ潯浠?        }
        if (!env?.ASSETS) {
            // ASSETS 涓?OpenNext Workers 缁戝畾锛岀己澶卞彲鑳芥槸鏋勫缓/閰嶇疆寮傚父
            // 浠呮爣璁颁絾涓嶉樆鏂紙鏌愪簺閰嶇疆鍙兘涓嶇洿鎺ユ毚闇诧級
        }
        if (missing.length || missingBindings.length) {
            if (!options.includeDetails) {
                return {
                    ok: false,
                    error: "Required environment configuration is missing",
                };
            }
            return {
                ok: false,
                error: `Missing env: ${missing.join(",")} | Missing bindings: ${missingBindings.join(",")}`,
            };
        }
        // 鍙€夐」涓嶉樆鏂?        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkAppUrl({
    runtimeOrigin,
    env,
    includeDetails,
}: {
    runtimeOrigin?: string;
    env: CloudflareBindings;
    includeDetails: boolean;
}): Promise<CheckResult> {
    try {
        // 浼樺厛浠庣幆澧冨彉閲忚鍙栧熀纭€ URL锛岄伩鍏嶅 DB 鐨勫己渚濊禆
        const fromEnv = String(
            (env as unknown as { NEXT_PUBLIC_APP_URL?: string })
                .NEXT_PUBLIC_APP_URL ?? "",
        ).trim();
        let base = fromEnv || String(runtimeOrigin ?? "");
        if (!base) {
            // 鍥為€€鍒版暟鎹簱閰嶇疆锛堣嫢瀛樺湪锛?            const db = await getDb();
            const rows = await db.select().from(siteSettings).limit(1);
            const domain = rows?.[0]?.domain ?? "";
            const settings = domain
                ? ({ domain } as SiteSettingsPayload)
                : undefined;
            base = resolveAppUrl(settings, {
                envAppUrl: (env as unknown as { NEXT_PUBLIC_APP_URL?: string })
                    .NEXT_PUBLIC_APP_URL,
            });
        }
        if (!base) {
            return {
                ok: false,
                error: includeDetails
                    ? "Failed to resolve app base URL"
                    : "Application base URL could not be resolved",
            };
        }
        // 鍩烘湰鏍煎紡鏍￠獙
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

async function checkExternalServices(
    env: CloudflareBindings,
): Promise<CheckResult> {
    try {
        const base = String(
            (env as unknown as { CREEM_API_URL?: string })?.CREEM_API_URL ?? "",
        ).trim();
        if (!base) {
            // 鏈厤缃垯璺宠繃锛屼笉闃绘柇
            return { ok: true };
        }
        const bearer = String(
            (env as unknown as { CREEM_API_KEY?: string })?.CREEM_API_KEY ?? "",
        ).trim();
        // 缂哄皯璁块棶浠ょ墝鏃讹紝涓嶅皢澶栭儴鏈嶅姟浣滀负闃绘柇椤癸紙鐩存帴瑙嗕负閫氳繃锛?        if (!bearer) {
            return { ok: true };
        }
        const headers: Record<string, string> = {};
        headers.authorization = `Bearer ${bearer}`;

        const endpointBase = base.replace(/\/+$/, "");
        const candidates = ["/status", ""]; // 浼樺厛灏濊瘯 /status锛屽叾娆℃牴璺緞

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
                // 2xx/3xx/401/403 瑙嗕负杩為€氾紱5xx 瑙嗕负澶辫触
                if (res.status < 500) {
                    return { ok: true };
                }
            } catch (_error) {
                // 缁х画灏濊瘯涓嬩竴涓€欓€?            }
        }

        return { ok: false, error: "External service unreachable or 5xx" };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

