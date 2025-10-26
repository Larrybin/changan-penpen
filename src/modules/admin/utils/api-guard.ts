import { NextResponse } from "next/server";
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

export function withAdminRoute<
    TParams = Record<string, string | string[] | undefined>,
    TResult extends Response | NextResponse = NextResponse,
>(
    handler: AdminRouteHandler<TParams, TResult>,
    options?: {
        onUnauthorized?: (result: AdminGuardResult) => NextResponse;
    },
) {
    return async (
        request: Request,
        context: { params: TParams } = { params: {} as TParams },
    ): Promise<TResult | NextResponse> => {
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

        return handler({
            request,
            params: context.params,
            user: guardResult.user,
        });
    };
}
