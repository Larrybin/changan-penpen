import { NextResponse } from "next/server";
import type { AuthUser } from "@/modules/auth/models/user.model";
import { checkAdminAccessFromHeaders } from "@/modules/admin/utils/admin-access";
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
