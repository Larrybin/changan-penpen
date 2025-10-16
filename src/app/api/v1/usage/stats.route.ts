import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getUsageDaily } from "@/modules/creem/services/usage.service";

function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
            });
        }

        const url = new URL(request.url);
        const days = Math.min(
            90,
            Math.max(1, Number(url.searchParams.get("days") || 30)),
        );
        const end = new Date();
        const start = new Date(
            end.getTime() - (days - 1) * 24 * 60 * 60 * 1000,
        );
        const fromDate = formatDate(start);
        const toDate = formatDate(end);

        const rows = await getUsageDaily(session.user.id, fromDate, toDate);
        return new Response(
            JSON.stringify({ success: true, data: { fromDate, toDate, rows } }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("[api/usage/stats] error:", error);
        return handleApiError(error);
    }
}
