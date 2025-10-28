import { desc, sql } from "drizzle-orm";

import { adminAuditLogs, getDb } from "@/db";
import { runPaginatedQuery } from "@/modules/admin/utils/query-factory";

export interface RecordAdminAuditLogInput {
    adminEmail: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: string;
}

export async function recordAdminAuditLog(input: RecordAdminAuditLogInput) {
    const db = await getDb();
    await db.insert(adminAuditLogs).values({
        adminEmail: input.adminEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata,
        createdAt: new Date().toISOString(),
    });
}

export interface ListAuditLogsOptions {
    page?: number;
    perPage?: number;
}

export async function listAuditLogs(options: ListAuditLogsOptions = {}) {
    const db = await getDb();
    const { rows, total } = await runPaginatedQuery({
        page: options.page,
        perPage: options.perPage,
        fetchRows: async ({ limit, offset }) =>
            db
                .select()
                .from(adminAuditLogs)
                .orderBy(desc(adminAuditLogs.createdAt))
                .limit(limit)
                .offset(offset),
        fetchTotal: async () => {
            const result = await db
                .select({ count: sql<number>`count(*)` })
                .from(adminAuditLogs);
            return result[0]?.count ?? 0;
        },
    });

    return {
        data: rows,
        total,
    };
}
