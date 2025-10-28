import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import {
    addFreeMonthlyCreditsIfNeeded,
    getCreditTransactions,
} from "@/modules/billing/services/credits.service";

export async function GET(request: Request) {
    try {
        const auth = await getAuthInstance();
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return createApiErrorResponse({
                status: 401,
                code: "UNAUTHORIZED",
                message: "Authentication required",
                severity: "high",
            });
        }

        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") ?? "10");

        const [credits, history] = await Promise.all([
            addFreeMonthlyCreditsIfNeeded(session.user.id),
            getCreditTransactions({
                userId: session.user.id,
                page: 1,
                limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
            }),
        ]);

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    credits,
                    transactions: history.transactions,
                    pagination: history.pagination,
                },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("[api/credits/snapshot] error:", error);
        return handleApiError(error);
    }
}
