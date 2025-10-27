import type { AppRouteHandlerFn } from "next/dist/server/route-modules/app-route/module";
import { NextResponse } from "next/server";

import handleApiError from "@/lib/api-error";
import { recordApiRequestMetric } from "@/lib/observability/api-metrics";
import { createLogger, loggerFromTrace } from "@/lib/observability/logger";
import {
    applyTraceContextHeaders,
    createTraceContext,
    mergeTraceContext,
    parseTraceContextFromHeaders,
} from "@/lib/observability/trace";
import { checkAdminAccessFromHeaders } from "@/modules/admin/utils/admin-access";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { getCurrentUser } from "@/modules/auth/utils/auth-utils";

export interface AdminGuardResult {
    user?: AuthUser;
    response?: NextResponse;
}

export async function requireAdminRequest(
    request: Request,
): Promise<AdminGuardResult> {
    const user = await getCurrentUser();
    if (!user) {
        return {
            response: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            ),
        };
    }

    const allowed = await checkAdminAccessFromHeaders(
        request.headers,
        user.email,
    );
    if (!allowed) {
        return {
            response: NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 },
            ),
        };
    }

    return { user };
}

export interface AdminRouteContext<
    TParams = Record<string, string | string[] | undefined>,
> {
    request: Request;
    params: TParams;
    user: AuthUser;
    trace: ReturnType<typeof createTraceContext>;
    logger: ReturnType<typeof createLogger>;
}

export type AdminRouteHandler<
    TParams = Record<string, string | string[] | undefined>,
    TResult extends Response | NextResponse = NextResponse,
> = (context: AdminRouteContext<TParams>) => Promise<TResult> | TResult;

type NextRouteRequest = Parameters<AppRouteHandlerFn>[0];
type NextRouteContext = Parameters<AppRouteHandlerFn>[1];
type RouteParamRecord = Record<string, string | string[] | undefined>;
type GuardedRouteContext = Omit<NextRouteContext, "params"> & {
    params: NextRouteContext extends { params?: Promise<infer Value> }
        ? Promise<Value>
        : Promise<RouteParamRecord>;
};

export function withAdminRoute<
    TParams = Record<string, string | string[] | undefined>,
    TResult extends Response | NextResponse = NextResponse,
>(
    handler: AdminRouteHandler<TParams, TResult>,
    options?: {
        onUnauthorized?: (result: AdminGuardResult) => NextResponse;
    },
) {
    const wrapped = async (
        request: NextRouteRequest,
        context: GuardedRouteContext,
    ): Promise<TResult | NextResponse | Response> => {
        const hasHighResTimer =
            typeof performance !== "undefined" &&
            typeof performance.now === "function";
        const startedAt = hasHighResTimer ? performance.now() : Date.now();
        const baseTrace = parseTraceContextFromHeaders(request.headers);
        let trace = createTraceContext(baseTrace);
        let logger = loggerFromTrace(trace, { source: "admin-route" });

        const guardResult = await requireAdminRequest(request);
        if (!guardResult.user) {
            const durationMs = hasHighResTimer
                ? performance.now() - (startedAt as number)
                : Date.now() - (startedAt as number);
            const response = options?.onUnauthorized
                ? options.onUnauthorized(guardResult)
                : guardResult.response ??
                  NextResponse.json({ message: "Unauthorized" }, { status: 401 });
            applyTraceContextHeaders(response.headers, trace);
            const status = "status" in response ? response.status : 401;
            recordApiRequestMetric({
                route: request.url,
                method: request.method ?? "GET",
                status,
                durationMs,
                traceId: trace.traceId,
            });
            logger.warn("admin route unauthorized", {
                status,
                durationMs,
                route: request.url,
            });
            return response;
        }

        const params = (await context.params) as RouteParamRecord as TParams;
        trace = mergeTraceContext(trace, { userId: guardResult.user.id });
        logger = logger.child({ userId: guardResult.user.id });

        const computeDuration = () =>
            hasHighResTimer
                ? performance.now() - (startedAt as number)
                : Date.now() - (startedAt as number);

        try {
            const result = await handler({
                request: request as Request,
                params,
                user: guardResult.user,
                trace,
                logger,
            });
            const durationMs = computeDuration();
            const response = (() => {
                if (result instanceof NextResponse || result instanceof Response) {
                    return result;
                }
                if (result === null || result === undefined) {
                    logger.warn("admin route returned empty result", {
                        route: request.url,
                    });
                    return new NextResponse(null, { status: 204 });
                }
                logger.warn("admin route returned non-response payload", {
                    route: request.url,
                    resultType: typeof result,
                });
                return NextResponse.json(result as unknown);
            })();
            const status = response.status ?? 200;
            applyTraceContextHeaders(response.headers, trace);
            recordApiRequestMetric({
                route: request.url,
                method: request.method ?? "GET",
                status,
                durationMs,
                traceId: trace.traceId,
                userId: guardResult.user.id,
            });
            logger.info("admin route success", {
                status,
                durationMs,
                route: request.url,
            });
            return response as TResult;
        } catch (error) {
            const response = handleApiError(error);
            const durationMs = computeDuration();
            const status = response.status ?? 500;
            applyTraceContextHeaders(response.headers, trace);
            recordApiRequestMetric({
                route: request.url,
                method: request.method ?? "GET",
                status,
                durationMs,
                traceId: trace.traceId,
                userId: guardResult.user.id,
            });
            logger.error("admin route error", {
                status,
                durationMs,
                route: request.url,
                error,
            });
            return response;
        }
    };

    return wrapped;
}
