import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customers } from "@/modules/creem/schemas/billing.schema";

export const orders = sqliteTable(
    "orders",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        customerId: integer("customer_id")
            .notNull()
            .references(() => customers.id, { onDelete: "cascade" }),
        amountCents: integer("amount_cents").notNull().default(0),
        currency: text("currency").notNull().default("USD"),
        status: text("status").notNull().default("pending"),
        source: text("source"),
        creemOrderId: text("creem_order_id"),
        createdAt: text("created_at").notNull(),
    },
    (table) => [
        index("orders_created_at_idx").on(table.createdAt),
        index("orders_customer_created_at_idx").on(
            table.customerId,
            table.createdAt,
        ),
    ],
);
