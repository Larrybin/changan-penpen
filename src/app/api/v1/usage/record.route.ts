import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { recordUsage } from "@/modules/creem/services/usage.service";

type Body = {
    feature?: string;
    amount?: number;
    unit?: string;
    metadata?: Record<string, unknown>;
    consumeCredits?: number;
};

export async function POST(request: Request) {
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

        const body = (await request.json()) as Body;
        const feature = (body.feature || "").trim();
        const amount = Number(body.amount ?? 0);
        const unit = (body.unit || "").trim();
        if (!feature || !unit || !Number.isFinite(amount) || amount <= 0) {
            return createApiErrorResponse({
                status: 400,
                code: "INVALID_REQUEST",
                message:
                    "feature/unit must be provided and amount must be positive",
                details: {
                    feature,
                    unit,
                    amount,
                },
                severity: "medium",
            });
        }

        const result = await recordUsage({
            userId: session.user.id,
            feature,
            amount,
            unit,
            metadata: body.metadata,
            consumeCredits:
                body.consumeCredits && body.consumeCredits > 0
                    ? body.consumeCredits
                    : undefined,
        });

        return new Response(
            JSON.stringify({
                success: true,
                data: { date: result.date, credits: result.newCredits ?? null },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("[api/usage/record] error:", error);
        return handleApiError(error);
    }
}
