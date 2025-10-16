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

type R2ListLike = { list: (options?: unknown) => Promise<unknown> };
type R2EnvLike = { next_cf_app_bucket: R2ListLike };

function hasR2Bucket(env: unknown): env is R2EnvLike {
    try {
        const rec = env as Record<string, unknown> | null | undefined;
        const bucketVal = rec
            ? (rec as Record<string, unknown>).next_cf_app_bucket
            : undefined;
        const bucket = bucketVal as { list?: unknown } | undefined;
        return (
            !!bucket &&
            typeof (bucket as { list?: unknown }).list === "function"
        );
    } catch {
        return false;
    }
}

async function checkR2(env: CloudflareBindings): Promise<CheckResult> {
    try {
        // 确认绑定存在
        if (!hasR2Bucket(env)) {
            return {
                ok: false,
                error: "R2 binding next_cf_app_bucket missing",
            };
        }
        // 列表请求（limit=1）验证可访问性
        await env.next_cf_app_bucket.list({
            limit: 1,
        });
        return { ok: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}

// 辅助：解析 fast 标记
function computeFast(url: URL): boolean {
    const v = (
        url.searchParams.get("fast") ||
        url.searchParams.get("mode") ||
        ""
    ).toLowerCase();
    return v === "1" || v === "true" || v === "fast";
}

// 辅助：安全获取请求来源
function getRequestOriginSafe(request: Request): string {
    try {
        return new URL(request.url).origin;
    } catch {
        return "";
    }
}

// 辅助：是否允许输出详细检查结果
function resolveAllowDetails(
    envRecord: Record<string, unknown>,
    providedToken: string,
): boolean {
    const configuredToken =
        typeof (envRecord as Record<string, unknown>).HEALTH_ACCESS_TOKEN ===
        "string"
            ? (
                  (envRecord as Record<string, string>).HEALTH_ACCESS_TOKEN ||
                  ""
              ).trim()
            : "";
    const envMode =
        typeof (envRecord as Record<string, unknown>).NEXTJS_ENV === "string"
            ? (
                  (envRecord as Record<string, string>).NEXTJS_ENV || ""
              ).toLowerCase()
            : "";
    return configuredToken
        ? providedToken === configuredToken
        : envMode !== "production";
}

// 辅助：从环境得出强制开关
function getRequireFlags(
    envRecord: Record<string, unknown>,
    fast: boolean,
): { requireExternal: boolean; requireDb: boolean; requireR2: boolean } {
    if (fast)
        return { requireExternal: false, requireDb: false, requireR2: false };
    const asBool = (v: unknown) => String(v ?? "false") === "true";
    return {
        requireExternal: asBool(
            (envRecord.HEALTH_REQUIRE_EXTERNAL as string | undefined) ??
                "false",
        ),
        requireDb: asBool(
            (envRecord.HEALTH_REQUIRE_DB as string | undefined) ?? "false",
        ),
        requireR2: asBool(
            (envRecord.HEALTH_REQUIRE_R2 as string | undefined) ?? "false",
        ),
    };
}

// 辅助：根据 flags 与 allowDetails 计算总健康态
function computeOverallOk(
    allowDetails: boolean,
    flags: { requireExternal: boolean; requireDb: boolean; requireR2: boolean },
    results: {
        db: CheckResult;
        r2: CheckResult;
        envs: CheckResult;
        appUrl: CheckResult;
        external: CheckResult;
    },
): boolean {
    const dbHealthy = allowDetails
        ? !flags.requireDb || results.db.ok
        : results.db.ok;
    const r2Healthy = allowDetails
        ? !flags.requireR2 || results.r2.ok
        : results.r2.ok;
    const externalHealthy = allowDetails
        ? !flags.requireExternal || results.external.ok
        : results.external.ok;
    return (
        dbHealthy &&
        r2Healthy &&
        results.envs.ok &&
        results.appUrl.ok &&
        externalHealthy
    );
}

// 辅助：生成检查对象（详细或摘要）
function buildChecksPayload(
    allowDetails: boolean,
    results: {
        db: CheckResult;
        r2: CheckResult;
        envs: CheckResult;
        appUrl: CheckResult;
        external: CheckResult;
    },
) {
    if (allowDetails)
        return {
            db: results.db,
            r2: results.r2,
            env: results.envs,
            appUrl: results.appUrl,
            external: results.external,
        } as const;
    return {
        db: { ok: results.db.ok },
        r2: { ok: results.r2.ok },
        env: { ok: results.envs.ok },
        appUrl: { ok: results.appUrl.ok },
        external: { ok: results.external.ok },
    } as const;
}

export async function GET(request: Request) {
    const startedAt = Date.now();
    const urlObj = new URL(request.url);
    const fast = computeFast(urlObj);
    const reqOrigin = getRequestOriginSafe(request);

    const { env } = await getCloudflareContext({ async: true });
    const envRecord = env as unknown as Record<string, unknown>;
    const providedToken = extractAccessToken(request.headers);
    const allowDetails = resolveAllowDetails(envRecord, providedToken);

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
    const requireFlags = getRequireFlags(envRecord, fast);
    const results = { db, r2, envs, appUrl, external } as const;
    const ok = computeOverallOk(allowDetails, requireFlags, results);

    const checks = buildChecksPayload(allowDetails, results);

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

        const googleClientId =
            typeof (envRecord as Record<string, unknown>).GOOGLE_CLIENT_ID ===
            "string"
                ? (
                      (envRecord as Record<string, string>).GOOGLE_CLIENT_ID ||
                      ""
                  ).trim()
                : "";
        const googleClientSecret =
            typeof (envRecord as Record<string, unknown>)
                .GOOGLE_CLIENT_SECRET === "string"
                ? (
                      (envRecord as Record<string, string>)
                          .GOOGLE_CLIENT_SECRET || ""
                  ).trim()
                : "";
        if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
            return {
                ok: false,
                error: "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET must both be set to enable Google OAuth",
            };
        }

        // 检查关键绑定是否存在
        const missingBindings: string[] = [];
        if (!hasR2Bucket(env)) {
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
                try {
                    console.debug("external connectivity check failed", {
                        url,
                        error: _error,
                    });
                } catch {}
                // 继续尝试下一个候选
                // 继续尝试下一个候选
            }
        }

        return { ok: false, error: "External service unreachable or 5xx" };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}
