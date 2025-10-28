import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const adminDashboardCache = sqliteTable(
    "admin_dashboard_cache",
    {
        key: text("key").primaryKey(),
        tenantId: text("tenant_id"),
        fromDate: text("from_date"),
        payload: text("payload").notNull(),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
        expiresAt: text("expires_at").notNull(),
    },
    (table) => ({
        tenantFromIdx: index("admin_dashboard_cache_tenant_from_idx").on(
            table.tenantId,
            table.fromDate,
        ),
        expiresAtIdx: index("admin_dashboard_cache_expires_at_idx").on(
            table.expiresAt,
        ),
    }),
);
