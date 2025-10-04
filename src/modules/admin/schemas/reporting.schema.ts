import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const reports = sqliteTable("reports", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(),
    parameters: text("parameters"),
    status: text("status").notNull().default("pending"),
    downloadUrl: text("download_url"),
    createdAt: text("created_at").notNull(),
    completedAt: text("completed_at"),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adminEmail: text("admin_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
});
