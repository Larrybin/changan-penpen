import { getAuthInstance } from "@/modules/auth/utils/auth-utils";
import { getCreditTransactions } from "@/modules/billing/services/credits.service";

export async function GET(request: Request) {
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

        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const limit = Number(url.searchParams.get("limit") ?? "10");

        const result = await getCreditTransactions({
            userId: session.user.id,
            page: Number.isFinite(page) && page > 0 ? page : 1,
            limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
        });

        return new Response(
            JSON.stringify({
                success: true,
                data: result,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("[api/credits/history] error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Internal server error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }
}
