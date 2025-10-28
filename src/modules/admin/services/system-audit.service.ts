import { desc, sql } from "drizzle-orm";

import { adminAuditLogs, getDb } from "@/db";
import { createSimplePaginatedList } from "@/modules/admin/utils/query-factory";

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

const runAuditLogQuery = createSimplePaginatedList({
    buildBaseQuery: async (db, { limit, offset }) =>
        db
            .select()
            .from(adminAuditLogs)
            .orderBy(desc(adminAuditLogs.createdAt))
            .limit(limit)
            .offset(offset),
    buildTotalQuery: async (db) =>
        db
            .select({ count: sql<number>`count(*)` })
            .from(adminAuditLogs),
});

export async function listAuditLogs(options: ListAuditLogsOptions = {}) {
    return await runAuditLogQuery(options);
}
