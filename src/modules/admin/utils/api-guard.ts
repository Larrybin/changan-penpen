import type { AppRouteHandlerFn } from "next/dist/server/route-modules/app-route/module";
import { NextResponse } from "next/server";

import handleApiError from "@/lib/api-error";
import { recordApiRequestMetric } from "@/lib/observability/api-metrics";
import type { createLogger } from "@/lib/observability/logger";
import { loggerFromTrace } from "@/lib/observability/logger";
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
    const createTimer = () => {
        const highRes =
            typeof performance !== "undefined" &&
            typeof performance.now === "function";
        const startedAt = highRes ? performance.now() : Date.now();
        return {
            elapsed() {
                return highRes
                    ? performance.now() - (startedAt as number)
                    : Date.now() - (startedAt as number);
            },
        };
    };

    const buildResponseFromResult = (
        result: unknown,
        logger: ReturnType<typeof loggerFromTrace>,
        route: string,
    ): NextResponse | Response => {
        if (result instanceof NextResponse || result instanceof Response) {
            return result;
        }
        if (result === null || result === undefined) {
            logger.warn("admin route returned empty result", { route });
            return new NextResponse(null, { status: 204 });
        }
        logger.warn("admin route returned non-response payload", {
            route,
            resultType: typeof result,
        });
        return NextResponse.json(result as unknown);
    };

    type LogMethod = "info" | "warn" | "error";

    const finalizeResponse = <T extends NextResponse | Response>(
        response: T,
        params: {
            trace: ReturnType<typeof createTraceContext>;
            logger: ReturnType<typeof loggerFromTrace>;
            timer: { elapsed(): number };
            request: NextRouteRequest;
            userId?: string;
            level: LogMethod;
            message: string;
            extra?: Record<string, unknown>;
        },
    ): T => {
        const { trace, logger, timer, request, userId, level, message, extra } =
            params;
        const durationMs = timer.elapsed();
        const status = "status" in response ? (response.status ?? 200) : 200;
        applyTraceContextHeaders(response.headers, trace);
        recordApiRequestMetric({
            route: request.url,
            method: request.method ?? "GET",
            status,
            durationMs,
            traceId: trace.traceId,
            userId,
        });
        logger[level](message, {
            status,
            durationMs,
            route: request.url,
            ...extra,
        });
        return response;
    };

    const handleUnauthorized = (
        guardResult: AdminGuardResult,
        trace: ReturnType<typeof createTraceContext>,
        logger: ReturnType<typeof loggerFromTrace>,
        timer: { elapsed(): number },
        request: NextRouteRequest,
    ) => {
        const response = options?.onUnauthorized
            ? options.onUnauthorized(guardResult)
            : (guardResult.response ??
              NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
        return finalizeResponse(response, {
            trace,
            logger,
            timer,
            request,
            level: "warn",
            message: "admin route unauthorized",
        });
    };

    const executeHandler = async (args: {
        request: NextRouteRequest;
        params: TParams;
        user: AuthUser;
        trace: ReturnType<typeof createTraceContext>;
        logger: ReturnType<typeof loggerFromTrace>;
        timer: { elapsed(): number };
    }): Promise<TResult | NextResponse | Response> => {
        const { request, params, user, trace, logger, timer } = args;
        try {
            const result = await handler({
                request: request as Request,
                params,
                user,
                trace,
                logger,
            });
            const response = buildResponseFromResult(
                result,
                logger,
                request.url,
            );
            return finalizeResponse(response, {
                trace,
                logger,
                timer,
                request,
                userId: user.id,
                level: "info",
                message: "admin route success",
            }) as TResult;
        } catch (error) {
            const response = handleApiError(error);
            return finalizeResponse(response, {
                trace,
                logger,
                timer,
                request,
                userId: user.id,
                level: "error",
                message: "admin route error",
                extra: { error },
            });
        }
    };

    const wrapped = async (
        request: NextRouteRequest,
        context: GuardedRouteContext,
    ): Promise<TResult | NextResponse | Response> => {
        const timer = createTimer();
        const baseTrace = parseTraceContextFromHeaders(request.headers);
        let trace = createTraceContext(baseTrace);
        let logger = loggerFromTrace(trace, { source: "admin-route" });

        const guardResult = await requireAdminRequest(request);
        if (!guardResult.user) {
            return handleUnauthorized(
                guardResult,
                trace,
                logger,
                timer,
                request,
            );
        }

        const params = (await context.params) as RouteParamRecord as TParams;
        trace = mergeTraceContext(trace, { userId: guardResult.user.id });
        logger = logger.child({ userId: guardResult.user.id });

        return executeHandler({
            request,
            params,
            user: guardResult.user,
            trace,
            logger,
            timer,
        });
    };

    return wrapped;
}
