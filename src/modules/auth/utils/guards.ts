import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";

// 返回 userId 或 Response（错误时）
export async function requireSessionUser(
    request: Request,
): Promise<string | Response> {
    const auth = await getAuthInstance();
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
        return createApiErrorResponse({
            status: 401,
            code: "UNAUTHORIZED",
            message: "Unauthorized",
        });
    }
    return userId;
}
