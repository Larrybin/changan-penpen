/**
 * Admin Performance Data API
 * Admin性能数据API路由
 * 提供Web Vitals、SEO指标和系统健康状态的综合数据
 */

import { NextResponse } from "next/server";
import {
    AdminCacheKeyBuilder,
    getAdminCacheManager,
    invalidateAdminCache,
    withAdminCache,
} from "@/lib/cache/admin-cache";
import type {
    PerformanceMetrics,
    PerformanceQueryParams as ServicePerformanceQueryParams,
} from "@/modules/admin/services/performance-data.service";
import { getAdminPerformanceMetrics } from "@/modules/admin/services/performance-data.service";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";

const VALID_TIMEFRAMES = ["1h", "24h", "7d", "30d"] as const;
type PerformanceTimeframe = (typeof VALID_TIMEFRAMES)[number];

// 性能数据查询参数
type PerformanceQueryParams = ServicePerformanceQueryParams & {
    timeframe: PerformanceTimeframe;
    bypassCache?: string;
};

/**
 * 统一的API响应格式
 */
interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        cacheHit?: boolean;
        responseTime?: number;
        timestamp: string;
        timeframe?: string;
        refreshed?: boolean;
    };
}

function isValidTimeframe(value: unknown): value is PerformanceTimeframe {
    return (
        typeof value === "string" &&
        (VALID_TIMEFRAMES as readonly string[]).includes(value)
    );
}

/**
 * GET /api/v1/admin/performance
 * 获取综合性能数据
 */
function buildErrorResponse(
    code: string,
    message: string,
    init?: ResponseInit,
    details?: unknown,
): NextResponse<APIResponse> {
    return NextResponse.json<APIResponse>(
        {
            success: false,
            error: {
                code,
                message,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        },
        init,
    );
}

export async function GET(
    request: Request,
): Promise<NextResponse<APIResponse>> {
    const startTime = performance.now();

    // 权限验证
    const authResult = await requireAdminRequest(request);
    if (authResult.response) {
        return buildErrorResponse("UNAUTHORIZED", "Unauthorized", {
            status: authResult.response.status,
        });
    }

    // 解析查询参数
    const url = new URL(request.url);
    const timeframeParam = url.searchParams.get("timeframe");
    if (timeframeParam !== null && !isValidTimeframe(timeframeParam)) {
        return buildErrorResponse(
            "INVALID_TIMEFRAME",
            `Invalid timeframe. Must be one of: ${VALID_TIMEFRAMES.join(", ")}`,
            { status: 400 },
        );
    }

    const params: PerformanceQueryParams = {
        timeframe: isValidTimeframe(timeframeParam) ? timeframeParam : "24h",
        metrics: url.searchParams.get("metrics")?.split(","),
        bypassCache: url.searchParams.get("bypassCache") ?? "false",
        tenantId: url.searchParams.get("tenantId") ?? undefined,
    };

    // 缓存键生成
    const cacheKey = AdminCacheKeyBuilder.performanceMetrics(
        params.timeframe,
        params.tenantId,
    );

    try {
        let performanceData: PerformanceMetrics;
        let cacheHit = false;

        if (params.bypassCache !== "true") {
            // 尝试从缓存获取数据
            const cacheResult = await withAdminCache(
                "USER",
                () => cacheKey,
                () => getAdminPerformanceMetrics(params),
                { tenantId: params.tenantId, customTtl: 30 }, // 30秒缓存
            );

            performanceData = cacheResult.value;
            cacheHit = cacheResult.hit;
        } else {
            // 强制刷新缓存
            performanceData = await getAdminPerformanceMetrics(params);

            // 更新缓存
            const manager = getAdminCacheManager();
            await manager.set(cacheKey, performanceData, 30);
        }

        const responseTime = Math.round(performance.now() - startTime);

        // 记录性能指标
        console.info(
            `[Performance API] ${cacheHit ? "Cache HIT" : "Cache MISS"} - ${responseTime}ms`,
            {
                timeframe: params.timeframe,
                tenantId: params.tenantId,
                cacheHit,
                responseTime,
            },
        );

        return NextResponse.json<APIResponse<PerformanceMetrics>>({
            success: true,
            data: performanceData,
            meta: {
                cacheHit,
                responseTime,
                timestamp: new Date().toISOString(),
                timeframe: params.timeframe,
            },
        });
    } catch (error) {
        console.error("[Performance API] Error fetching performance metrics", {
            error: error instanceof Error ? error.message : String(error),
            timeframe: params.timeframe,
            tenantId: params.tenantId,
        });

        return buildErrorResponse(
            "PERFORMANCE_DATA_ERROR",
            "Failed to fetch performance metrics",
            { status: 500 },
            error instanceof Error ? error.stack : undefined,
        );
    }
}

/**
 * POST /api/v1/admin/performance/refresh
 * 强制刷新性能数据缓存
 */
export async function POST(
    request: Request,
): Promise<NextResponse<APIResponse>> {
    const startTime = performance.now();

    // 权限验证
    const authResult = await requireAdminRequest(request);
    if (authResult.response) {
        return buildErrorResponse("UNAUTHORIZED", "Unauthorized", {
            status: authResult.response.status,
        });
    }

    try {
        const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
        >;
        const timeframeValue = body.timeframe;
        if (timeframeValue !== undefined && !isValidTimeframe(timeframeValue)) {
            return buildErrorResponse(
                "INVALID_TIMEFRAME",
                `Invalid timeframe. Must be one of: ${VALID_TIMEFRAMES.join(", ")}`,
                { status: 400 },
            );
        }

        const params: PerformanceQueryParams = {
            timeframe: isValidTimeframe(timeframeValue)
                ? timeframeValue
                : "24h",
            tenantId:
                typeof body.tenantId === "string" ? body.tenantId : undefined,
        };

        // 强制刷新数据
        const performanceData = await getAdminPerformanceMetrics(params, true);

        // 更新缓存
        const cacheKey = AdminCacheKeyBuilder.performanceMetrics(
            params.timeframe,
            params.tenantId,
        );
        const manager = getAdminCacheManager();
        await manager.set(cacheKey, performanceData, 30);

        const responseTime = Math.round(performance.now() - startTime);

        console.info(
            `[Performance API] Cache refresh completed - ${responseTime}ms`,
            {
                timeframe: params.timeframe,
                tenantId: params.tenantId,
            },
        );

        return NextResponse.json<APIResponse<PerformanceMetrics>>({
            success: true,
            data: performanceData,
            meta: {
                cacheHit: false,
                responseTime,
                timestamp: new Date().toISOString(),
                timeframe: params.timeframe,
                refreshed: true,
            },
        });
    } catch (error) {
        console.error("[Performance API] Error refreshing performance data", {
            error: error instanceof Error ? error.message : String(error),
        });

        return buildErrorResponse(
            "REFRESH_ERROR",
            "Failed to refresh performance data",
            { status: 500 },
            error instanceof Error ? error.stack : undefined,
        );
    }
}

/**
 * 刷新性能数据缓存的辅助函数
 */
export async function invalidatePerformanceCache(options?: {
    tenantId?: string;
    timeframe?: PerformanceTimeframe;
}): Promise<void> {
    const timeframes: PerformanceTimeframe[] = options?.timeframe
        ? [options.timeframe]
        : [...VALID_TIMEFRAMES];

    const manager = getAdminCacheManager();

    await Promise.all(
        timeframes.map((timeframe) =>
            manager.del(
                AdminCacheKeyBuilder.performanceMetrics(
                    timeframe,
                    options?.tenantId,
                ),
            ),
        ),
    );

    await invalidateAdminCache("performance:metrics", {
        tenantId: options?.tenantId,
        level: "USER",
    });

    console.info("[Performance Cache] Cache invalidated", {
        timeframes,
        tenantId: options?.tenantId,
    });
}
