import { desc, eq, inArray, sql } from "drizzle-orm";

import { getDb, usageDaily, user } from "@/db";
import { normalizePagination } from "@/modules/admin/utils/pagination";
import { executePaginatedQuery } from "@/modules/admin/utils/query-factory";

export interface ListUsageOptions {
    page?: number;
    perPage?: number;
    tenantId?: string;
    feature?: string;
}

export async function listUsage(options: ListUsageOptions = {}) {
    const db = await getDb();
    const { page: normalizedPage, perPage: normalizedPerPage } =
        normalizePagination(options);
    const page = Math.max(normalizedPage, 1);
    const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
    const { rows, total } = await executePaginatedQuery({
        page,
        perPage,
        filters: [
            options.tenantId
                ? eq(usageDaily.userId, options.tenantId)
                : undefined,
            options.feature
                ? eq(usageDaily.feature, options.feature)
                : undefined,
        ],
        fetchRows: async ({ limit, offset, where }) => {
            const baseQuery = db
                .select({
                    userId: usageDaily.userId,
                    date: usageDaily.date,
                    feature: usageDaily.feature,
                    totalAmount: usageDaily.totalAmount,
                    unit: usageDaily.unit,
                })
                .from(usageDaily)
                .orderBy(desc(usageDaily.date))
                .limit(limit)
                .offset(offset);

            return where ? await baseQuery.where(where) : await baseQuery;
        },
        fetchTotal: async (where) => {
            const totalQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(usageDaily);
            const result = where
                ? await totalQuery.where(where)
                : await totalQuery;
            return result[0]?.count ?? 0;
        },
    });

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
        total,
    };
}
