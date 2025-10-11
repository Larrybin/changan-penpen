import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDb, siteSettings } from "@/db";
import { resolveAppUrl } from "@/lib/seo";
import type { SiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

// 在 Cloudflare Workers 上运行；该路由不依赖 edge 特性，使用 nodejs 运行时以简化打包
export const runtime = "nodejs";

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
    // 避免使用潜在超线性复杂度的正则，改为安全的字符串解析
    const auth = authorization.trim();
    if (auth.length >= 6 && auth.slice(0, 6).toLowerCase() === "bearer") {
        const token = auth.slice(6).trim();
        if (token) return token;
    }
    return auth;
}

async function checkDb(): Promise<CheckResult> {
    try {
        const db = await getDb();
        // 轻量查询验证连通性
        await db.select().from(siteSettings).limit(1);
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

async function checkR2(env: CloudflareBindings): Promise<CheckResult> {
    try {
        // 确认绑定存在
        if (!env || !("next_cf_app_bucket" in env)) {
            return {
                ok: false,
                error: "R2 binding next_cf_app_bucket missing",
            };
        }
        // 列表请求（limit=1）验证可访问性
        await (env as unknown as CloudflareEnv).next_cf_app_bucket.list({
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

    // 外部依赖是否为强制项由开关控制（默认不阻断）
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
        ? { db, r2, env: envs, appUrl, external }
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

        // 检查关键绑定是否存在
        const missingBindings: string[] = [];
        if (!(env as unknown as CloudflareEnv)?.next_cf_app_bucket) {
            missingBindings.push("next_cf_app_bucket");
        }
        // AI 和 ASSETS 绑定可选：仅记录，不阻断

        if (missing.length || missingBindings.length) {
            if (!options.includeDetails) {
                return {
                    ok: false,
                    error: "Required environment configuration is missing",
                };
            }
            return {
                ok: false,
                error: `Missing: secrets=[${missing.join(",")}], bindings=[${missingBindings.join(",")}]`,
            };
        }
        // 可选项不阻断
        return { ok: true };
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
        // 优先从环境变量读取基础 URL，避免对 DB 的强依赖
        const fromEnv = String(
            (env as unknown as { NEXT_PUBLIC_APP_URL?: string })
                .NEXT_PUBLIC_APP_URL ?? "",
        ).trim();
        let base = fromEnv || String(runtimeOrigin ?? "");
        if (!base) {
            // 回退到数据库配置（若存在）
            const db = await getDb();
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
        // 基本格式校验
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
            // 未配置则跳过，不阻断
            return { ok: true };
        }
        const bearer = String(
            (env as unknown as { CREEM_API_KEY?: string })?.CREEM_API_KEY ?? "",
        ).trim();
        // 缺少访问令牌时，不将外部服务作为阻断项
        if (!bearer) {
            return { ok: true };
        }
        const headers: Record<string, string> = {};
        headers.authorization = `Bearer ${bearer}`;

        // 避免使用正则修剪结尾斜杠，消除潜在回溯告警
        let end = base.length - 1;
        while (end >= 0 && base.charCodeAt(end) === 47 /* '/' */) {
            end--;
        }
        const endpointBase = base.slice(0, end + 1);
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
                // 2xx/3xx/401/403 视为连通；5xx 视为失败
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
