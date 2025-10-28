import {
    index,
    integer,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

export const customers = sqliteTable(
    "customers",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        creemCustomerId: text("creem_customer_id"),
        email: text("email"),
        name: text("name"),
        country: text("country"),
        credits: integer("credits").notNull().default(0),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
    },
    (table) => ({
        customersUserIdUnique: uniqueIndex("customers_user_id_unique").on(
            table.userId,
        ),
        customersCreemCustomerIdUnique: uniqueIndex(
            "customers_creem_customer_id_unique",
        ).on(table.creemCustomerId),
    }),
);

export const subscriptions = sqliteTable(
    "subscriptions",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        customerId: integer("customer_id")
            .notNull()
            .references(() => customers.id, { onDelete: "cascade" }),
        creemSubscriptionId: text("creem_subscription_id").notNull(),
        creemProductId: text("creem_product_id"),
        status: text("status"),
        currentPeriodStart: text("current_period_start"),
        currentPeriodEnd: text("current_period_end"),
        canceledAt: text("canceled_at"),
        metadata: text("metadata"),
        createdAt: text("created_at").notNull(),
        updatedAt: text("updated_at").notNull(),
    },
    (table) => ({
        subscriptionsCreemSubscriptionUnique: uniqueIndex(
            "subscriptions_creem_subscription_id_unique",
        ).on(table.creemSubscriptionId),
    }),
);

export const creditsHistory = sqliteTable(
    "credits_history",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        customerId: integer("customer_id")
            .notNull()
            .references(() => customers.id, { onDelete: "cascade" }),
        amount: integer("amount").notNull(),
        type: text("type").notNull(),
        description: text("description"),
        creemOrderId: text("creem_order_id"),
        createdAt: text("created_at").notNull(),
    },
    (table) => ({
        creditsHistoryOrderUnique: uniqueIndex(
            "credits_history_creem_order_id_unique",
        ).on(table.creemOrderId),
        creditsHistoryCreatedAtIdx: index("credits_history_created_at_idx").on(
            table.createdAt,
        ),
        creditsHistoryCustomerCreatedAtIdx: index(
            "credits_history_customer_created_at_idx",
        ).on(table.customerId, table.createdAt),
    }),
);
