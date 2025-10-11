import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { json } from "@/lib/http";
import { customers } from "@/modules/creem/schemas/billing.schema";

// 返回 creemCustomerId 或 Response（错误时）
export async function requireCreemCustomerId(
    userId: string,
): Promise<string | Response> {
    const db = await getDb();
    const rows = await db
        .select({ creemCustomerId: customers.creemCustomerId })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
    const creemCustomerId = rows[0]?.creemCustomerId;
    if (!creemCustomerId) {
        return json(404, {
            success: false,
            error: "No subscription/customer found",
            data: null,
        });
    }
    return creemCustomerId;
}
