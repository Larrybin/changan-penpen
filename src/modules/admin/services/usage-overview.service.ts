import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";

import { getDb, usageDaily, user } from "@/db";
import {
    decodeCursorPayload,
    encodeCursorPayload,
    runCursorPaginatedQuery,
} from "@/modules/admin/utils/query-factory";

export interface ListUsageOptions {
    perPage?: number;
    tenantId?: string;
    feature?: string;
    cursor?: string | null;
}

type UsageRow = {
    userId: string | null;
    date: string | null;
    feature: string | null;
    totalAmount: number | null;
    unit: string | null;
};

export async function listUsage(options: ListUsageOptions = {}) {
    const db = await getDb();
    const { rows, total, nextCursor } = await runCursorPaginatedQuery<
        UsageRow,
        { date: string; userId: string }
    >({
        cursor: options.cursor,
        perPage: options.perPage,
        filters: [
            options.tenantId
                ? eq(usageDaily.userId, options.tenantId)
                : undefined,
            options.feature
                ? eq(usageDaily.feature, options.feature)
                : undefined,
        ],
        decodeCursor: (cursor) =>
            decodeCursorPayload<{ date: string; userId: string }>(cursor),
        encodeCursor: encodeCursorPayload,
        getCursorValue: (row) => {
            if (!row.date || !row.userId) {
                return null;
            }
            return { date: row.date, userId: row.userId };
        },
        fetchRows: async ({ limit, cursor, where }) => {
            const baseQuery = db
                .select({
                    userId: usageDaily.userId,
                    date: usageDaily.date,
                    feature: usageDaily.feature,
                    totalAmount: usageDaily.totalAmount,
                    unit: usageDaily.unit,
                })
                .from(usageDaily)
                .orderBy(desc(usageDaily.date), desc(usageDaily.userId))
                .limit(limit);

            const cursorFilter = cursor
                ? or(
                      lt(usageDaily.date, cursor.date),
                      and(
                          eq(usageDaily.date, cursor.date),
                          lt(usageDaily.userId, cursor.userId),
                      ),
                  )
                : undefined;

            const combinedWhere = where && cursorFilter
                ? and(where, cursorFilter)
                : cursorFilter ?? where;

            return combinedWhere
                ? await baseQuery.where(combinedWhere)
                : await baseQuery;
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
            email: row.userId ? userMap.get(row.userId) ?? null : null,
        })),
        total,
        nextCursor: nextCursor ?? null,
    };
}
