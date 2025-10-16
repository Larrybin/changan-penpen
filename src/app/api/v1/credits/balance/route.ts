import { eq } from "drizzle-orm";
import { getDb, user } from "@/db";
import handleApiError from "@/lib/api-error";
import { createApiErrorResponse } from "@/lib/http-error";
import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { addFreeMonthlyCreditsIfNeeded } from "@/modules/billing/services/credits.service";

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

        const credits = await addFreeMonthlyCreditsIfNeeded(session.user.id);

        const db = await getDb();
        const [row] = await db
            .select({ currentCredits: user.currentCredits })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return new Response(
            JSON.stringify({
                success: true,
                data: { credits: row?.currentCredits ?? credits },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("[api/credits/balance] error:", error);
        return handleApiError(error);
    }
}
