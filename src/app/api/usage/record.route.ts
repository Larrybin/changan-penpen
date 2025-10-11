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
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const body = (await request.json()) as Body;
        const feature = (body.feature || "").trim();
        const amount = Number(body.amount ?? 0);
        const unit = (body.unit || "").trim();
        if (!feature || !unit || !Number.isFinite(amount) || amount <= 0) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Invalid feature/unit or amount must be positive",
                }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
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
        return new Response(
            JSON.stringify({
                success: false,
                error: "Internal server error",
                code: "ERR_UNEXPECTED",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
