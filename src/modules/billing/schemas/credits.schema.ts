import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { user } from "@/modules/auth/schemas/auth.schema";

const isoNow = () => new Date().toISOString();

export const CREDIT_TRANSACTION_TYPE = {
    PURCHASE: "PURCHASE",
    USAGE: "USAGE",
    MONTHLY_REFRESH: "MONTHLY_REFRESH",
    ADJUSTMENT: "ADJUSTMENT",
} as const;

export type CreditTransactionType =
    (typeof CREDIT_TRANSACTION_TYPE)[keyof typeof CREDIT_TRANSACTION_TYPE];

export const CREDIT_TRANSACTION_TYPES = [
    CREDIT_TRANSACTION_TYPE.PURCHASE,
    CREDIT_TRANSACTION_TYPE.USAGE,
    CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
    CREDIT_TRANSACTION_TYPE.ADJUSTMENT,
] as const;

export const creditTransactions = sqliteTable(
    "credit_transactions",
    {
        id: text("id")
            .primaryKey()
            .default(sql`('ctxn_' || lower(hex(randomblob(12))))`),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        amount: integer("amount").notNull(),
        remainingAmount: integer("remainingAmount").notNull().default(0),
        type: text("type", {
            enum: CREDIT_TRANSACTION_TYPES,
        }).notNull(),
        description: text("description", { length: 255 }).notNull(),
        expirationDate: text("expirationDate"),
        expirationDateProcessedAt: text("expirationDateProcessedAt"),
        paymentIntentId: text("paymentIntentId", { length: 255 }),
        createdAt: text("createdAt").notNull().$defaultFn(isoNow),
        updatedAt: text("updatedAt")
            .notNull()
            .$defaultFn(isoNow)
            .$onUpdate(isoNow),
    },
    (table) => [
        index("credit_transactions_user_id_idx").on(table.userId),
        index("credit_transactions_type_idx").on(table.type),
        index("credit_transactions_created_at_idx").on(table.createdAt),
        index("credit_transactions_expiration_idx").on(table.expirationDate),
        index("credit_transactions_payment_intent_idx").on(
            table.paymentIntentId,
        ),
    ],
);
