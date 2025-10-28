import {
    index,
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

export const usageEvents = sqliteTable("usage_events", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    amount: integer("amount").notNull(),
    unit: text("unit").notNull(),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
});

export const usageDaily = sqliteTable(
    "usage_daily",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        date: text("date").notNull(), // YYYY-MM-DD
        feature: text("feature").notNull(),
        totalAmount: integer("total_amount").notNull(),
        unit: text("unit").notNull(),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
    },
    (table) => ({
        usageDailyUserFeatureDateUnique: uniqueIndex(
            "usage_daily_user_feature_date_unique",
        ).on(table.userId, table.feature, table.date),
        usageDailyDateIdx: index("usage_daily_date_idx").on(table.date),
        usageDailyUserCreatedAtIdx: index(
            "usage_daily_user_created_at_idx",
        ).on(table.userId, table.createdAt),
    }),
);
