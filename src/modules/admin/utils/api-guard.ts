import { NextResponse } from "next/server";
import type { AppRouteHandlerFn } from "next/dist/server/route-modules/app-route/module";

import handleApiError from "@/lib/api-error";
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
        const guardResult = await requireAdminRequest(request);
        if (!guardResult.user) {
            if (options?.onUnauthorized) {
                return options.onUnauthorized(guardResult);
            }

            return (
                guardResult.response ??
                NextResponse.json({ message: "Unauthorized" }, { status: 401 })
            );
        }

        const params = (await context.params) as RouteParamRecord as TParams;

        try {
            return await handler({
                request: request as Request,
                params,
                user: guardResult.user,
            });
        } catch (error) {
            return handleApiError(error);
        }
    };

    return wrapped;
}
