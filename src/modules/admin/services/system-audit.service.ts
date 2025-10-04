import { desc, sql } from "drizzle-orm";
import { getDb, adminAuditLogs } from "@/db";

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

export async function listAuditLogs(options: ListAuditLogsOptions) {
    const db = await getDb();
    const page = Math.max(options.page ?? 1, 1);
    const perPage = Math.min(Math.max(options.perPage ?? 20, 1), 100);
    const offset = (page - 1) * perPage;

    const [rows, totalResult] = await Promise.all([
        db
            .select()
            .from(adminAuditLogs)
            .orderBy(desc(adminAuditLogs.createdAt))
            .limit(perPage)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(adminAuditLogs),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
        data: rows,
        total,
    };
}
