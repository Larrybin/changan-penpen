/**
 * Admin Performance Data API
 * Admin性能数据API路由
 * 提供Web Vitals、SEO指标和系统健康状态的综合数据
 */

import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/modules/admin/utils/api-guard";
import {
    withAdminCache,
    AdminCacheKeyBuilder,
    getAdminCacheManager
} from "@/lib/cache/admin-cache";
import { getAdminPerformanceMetrics } from "@/modules/admin/services/performance-data.service";

// 性能数据查询参数
interface PerformanceQueryParams {
    timeframe?: '1h' | '24h' | '7d' | '30d';
    metrics?: string[];
    bypassCache?: string;
    tenantId?: string;
}

/**
 * 统一的API响应格式
 */
interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        cacheHit?: boolean;
        responseTime?: number;
        timestamp: string;
        timeframe?: string;
    };
}

/**
 * GET /api/v1/admin/performance
 * 获取综合性能数据
 */
export async function GET(request: Request): Promise<NextResponse<APIResponse>> {
    const startTime = performance.now();

    // 权限验证
    const authResult = await requireAdminRequest(request);
    if (authResult.response) {
        return authResult.response;
    }

    // 解析查询参数
    const url = new URL(request.url);
    const params: PerformanceQueryParams = {
        timeframe: (url.searchParams.get("timeframe") as any) || '24h',
        metrics: url.searchParams.get("metrics")?.split(','),
        bypassCache: url.searchParams.get("bypassCache") || "false",
        tenantId: url.searchParams.get("tenantId") ?? undefined
    };

    // 验证时间范围参数
    const validTimeframes = ['1h', '24h', '7d', '30d'];
    if (!validTimeframes.includes(params.timeframe!)) {
        return NextResponse.json({
            success: false,
            error: {
                code: 'INVALID_TIMEFRAME',
                message: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        } as APIResponse, { status: 400 });
    }

    // 缓存键生成
    const cacheKey = AdminCacheKeyBuilder.performanceMetrics(params.timeframe!, params.tenantId);

    try {
        let performanceData;
        let cacheHit = false;

        if (params.bypassCache !== "true") {
            // 尝试从缓存获取数据
            const cacheResult = await withAdminCache(
                'USER',
                () => cacheKey,
                () => getAdminPerformanceMetrics(params),
                { tenantId: params.tenantId, customTtl: 30 } // 30秒缓存
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
        console.info(`[Performance API] ${cacheHit ? 'Cache HIT' : 'Cache MISS'} - ${responseTime}ms`, {
            timeframe: params.timeframe,
            tenantId: params.tenantId,
            cacheHit,
            responseTime
        });

        return NextResponse.json({
            success: true,
            data: performanceData,
            meta: {
                cacheHit,
                responseTime,
                timestamp: new Date().toISOString(),
                timeframe: params.timeframe
            }
        } as APIResponse);

    } catch (error) {
        console.error('[Performance API] Error fetching performance metrics', {
            error: error instanceof Error ? error.message : String(error),
            timeframe: params.timeframe,
            tenantId: params.tenantId
        });

        return NextResponse.json({
            success: false,
            error: {
                code: 'PERFORMANCE_DATA_ERROR',
                message: 'Failed to fetch performance metrics',
                details: error instanceof Error ? error.stack : undefined
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        } as APIResponse, { status: 500 });
    }
}

/**
 * POST /api/v1/admin/performance/refresh
 * 强制刷新性能数据缓存
 */
export async function POST(request: Request): Promise<NextResponse<APIResponse>> {
    const startTime = performance.now();

    // 权限验证
    const authResult = await requireAdminRequest(request);
    if (authResult.response) {
        return authResult.response;
    }

    try {
        const body = await request.json().catch(() => ({}));
        const params: PerformanceQueryParams = {
            timeframe: body.timeframe || '24h',
            tenantId: body.tenantId
        };

        // 强制刷新数据
        const performanceData = await getAdminPerformanceMetrics(params, true);

        // 更新缓存
        const cacheKey = AdminCacheKeyBuilder.performanceMetrics(params.timeframe!, params.tenantId);
        const manager = getAdminCacheManager();
        await manager.set(cacheKey, performanceData, 30);

        const responseTime = Math.round(performance.now() - startTime);

        console.info(`[Performance API] Cache refresh completed - ${responseTime}ms`, {
            timeframe: params.timeframe,
            tenantId: params.tenantId
        });

        return NextResponse.json({
            success: true,
            data: performanceData,
            meta: {
                cacheHit: false,
                responseTime,
                timestamp: new Date().toISOString(),
                timeframe: params.timeframe,
                refreshed: true
            }
        } as APIResponse);

    } catch (error) {
        console.error('[Performance API] Error refreshing performance data', {
            error: error instanceof Error ? error.message : String(error)
        });

        return NextResponse.json({
            success: false,
            error: {
                code: 'REFRESH_ERROR',
                message: 'Failed to refresh performance data',
                details: error instanceof Error ? error.stack : undefined
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        } as APIResponse, { status: 500 });
    }
}

/**
 * 刷新性能数据缓存的辅助函数
 */
export async function invalidatePerformanceCache(options?: {
    tenantId?: string;
    timeframe?: string;
}): Promise<void> {
    const timeframes = options?.timeframe ? [options.timeframe] : ['1h', '24h', '7d', '30d'];

    await Promise.all(
        timeframes.map(timeframe =>
            invalidateAdminCache('performance:metrics', {
                tenantId: options?.tenantId,
                level: 'USER',
                timeframe
            })
        )
    );

    console.info('[Performance Cache] Cache invalidated', {
        timeframes,
        tenantId: options?.tenantId
    });
}