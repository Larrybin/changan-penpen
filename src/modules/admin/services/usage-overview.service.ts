import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { usageDaily, user } from "@/db";
import { getDb } from "@/db";

export interface ListUsageOptions {
    page?: number;
    perPage?: number;
    tenantId?: string;
    feature?: string;
}

export async function listUsage(options: ListUsageOptions = {}) {
    const db = await getDb();
    const page = Math.max(options.page ?? 1, 1);
    const perPage = Math.min(Math.max(options.perPage ?? 20, 1), 100);
    const offset = (page - 1) * perPage;

    const query = db
        .select({
            userId: usageDaily.userId,
            date: usageDaily.date,
            feature: usageDaily.feature,
            totalAmount: usageDaily.totalAmount,
            unit: usageDaily.unit,
        })
        .from(usageDaily)
        .orderBy(desc(usageDaily.date))
        .limit(perPage)
        .offset(offset);

    const conditions = [] as ReturnType<typeof eq>[];
    if (options.tenantId) {
        conditions.push(eq(usageDaily.userId, options.tenantId));
    }
    if (options.feature) {
        conditions.push(eq(usageDaily.feature, options.feature));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const rows = whereClause ? await query.where(whereClause) : await query;

    const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(usageDaily);
    const totalRows = whereClause
        ? await totalQuery.where(whereClause)
        : await totalQuery;

    const userIds = Array.from(new Set(rows.map((row) => row.userId))).filter(
        Boolean,
    ) as string[];

    const userLookup = userIds.length
        ? await db
              .select({ id: user.id, email: user.email })
              .from(user)
              .where(inArray(user.id, userIds))
        : [];

    const userMap = new Map(userLookup.map((item) => [item.id, item.email]));

    return {
        data: rows.map((row) => ({
            ...row,
            email: userMap.get(row.userId) ?? null,
        })),
        total: totalRows[0]?.count ?? 0,
    };
}
