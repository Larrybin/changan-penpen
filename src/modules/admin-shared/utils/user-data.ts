import { desc, eq, sql } from "drizzle-orm";

import {
    customers,
    creditsHistory,
    orders,
    subscriptions,
    usageDaily,
    user,
} from "@/db";

import type { getDb } from "@/db";

type DbClient = Awaited<ReturnType<typeof getDb>>;

export type QueryRunner = <T>(operation: () => Promise<T>) => Promise<T>;

const directQueryRunner: QueryRunner = (operation) =>
    Promise.resolve().then(operation);

export interface UserCoreRecord {
    id: string;
    email: string | null;
    name: string | null;
    emailVerified: Date | string | boolean | null;
    createdAt: Date | string;
    updatedAt: Date | string | null;
    image: string | null;
    currentCredits: number | null;
    lastCreditRefreshAt: Date | string | null;
}

export async function fetchUserCore(
    db: DbClient,
    userId: string,
    runQuery: QueryRunner = directQueryRunner,
): Promise<UserCoreRecord | null> {
    const [row] = await runQuery(() =>
        db
            .select({
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                image: user.image,
                currentCredits: user.currentCredits,
                lastCreditRefreshAt: user.lastCreditRefreshAt,
            })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1),
    );

    return row ?? null;
}

export interface CustomerHistoryRecord {
    customer: Pick<
        typeof customers.$inferSelect,
        "id" | "credits" | "createdAt" | "updatedAt"
    > | null;
    credits: Array<
        Pick<
            typeof creditsHistory.$inferSelect,
            "id" | "amount" | "type" | "description" | "createdAt"
        >
    >;
    subscriptions: Array<
        Pick<
            typeof subscriptions.$inferSelect,
            | "id"
            | "status"
            | "currentPeriodStart"
            | "currentPeriodEnd"
            | "canceledAt"
            | "createdAt"
            | "updatedAt"
        >
    >;
}

export interface FetchCustomerHistoryOptions {
    runQuery?: QueryRunner;
    creditLimit?: number;
    subscriptionLimit?: number;
}

export async function fetchCustomerWithHistory(
    db: DbClient,
    userId: string,
    options: FetchCustomerHistoryOptions = {},
): Promise<CustomerHistoryRecord> {
    const runQuery = options.runQuery ?? directQueryRunner;
    const creditLimit = options.creditLimit ?? 20;
    const subscriptionLimit = options.subscriptionLimit ?? 10;

    const [customerRow] = await runQuery(() =>
        db
            .select({
                id: customers.id,
                credits: customers.credits,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt,
            })
            .from(customers)
            .where(eq(customers.userId, userId))
            .limit(1),
    );

    if (!customerRow) {
        return {
            customer: null,
            credits: [],
            subscriptions: [],
        };
    }

    const [creditRows, subscriptionRows] = await Promise.all([
        runQuery(() =>
            db
                .select({
                    id: creditsHistory.id,
                    amount: creditsHistory.amount,
                    type: creditsHistory.type,
                    description: creditsHistory.description,
                    createdAt: creditsHistory.createdAt,
                })
                .from(creditsHistory)
                .where(eq(creditsHistory.customerId, customerRow.id))
                .orderBy(desc(creditsHistory.createdAt))
                .limit(creditLimit),
        ),
        runQuery(() =>
            db
                .select({
                    id: subscriptions.id,
                    status: subscriptions.status,
                    currentPeriodStart: subscriptions.currentPeriodStart,
                    currentPeriodEnd: subscriptions.currentPeriodEnd,
                    canceledAt: subscriptions.canceledAt,
                    createdAt: subscriptions.createdAt,
                    updatedAt: subscriptions.updatedAt,
                })
                .from(subscriptions)
                .where(eq(subscriptions.customerId, customerRow.id))
                .orderBy(desc(subscriptions.createdAt))
                .limit(subscriptionLimit),
        ),
    ]);

    return {
        customer: customerRow,
        credits: creditRows,
        subscriptions: subscriptionRows,
    };
}

export interface FetchUsageHistoryOptions {
    limit?: number;
    runQuery?: QueryRunner;
}

export async function fetchUsageHistory(
    db: DbClient,
    userId: string,
    options: FetchUsageHistoryOptions = {},
) {
    const runQuery = options.runQuery ?? directQueryRunner;
    const limit = options.limit ?? 30;

    return await runQuery(() =>
        db
            .select({
                id: usageDaily.id,
                date: usageDaily.date,
                feature: usageDaily.feature,
                totalAmount: usageDaily.totalAmount,
                unit: usageDaily.unit,
            })
            .from(usageDaily)
            .where(eq(usageDaily.userId, userId))
            .orderBy(desc(usageDaily.date))
            .limit(limit),
    );
}

export async function fetchUsageSummary(
    db: DbClient,
    userId: string,
    options: { limit?: number } = {},
) {
    const limit = options.limit ?? 30;

    return await db
        .select({
            date: usageDaily.date,
            total: sql<number>`sum(${usageDaily.totalAmount})`,
            unit: sql<string | null>`max(${usageDaily.unit})`,
        })
        .from(usageDaily)
        .where(eq(usageDaily.userId, userId))
        .groupBy(usageDaily.date)
        .orderBy(desc(usageDaily.date))
        .limit(limit);
}

export interface OrderSummary {
    revenue: number;
    ordersCount: number;
}

export async function fetchOrderSummary(
    db: DbClient,
    customerId: number | null,
) {
    if (!customerId) {
        return null;
    }

    const [row] = await db
        .select({
            revenue: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
            ordersCount: sql<number>`count(*)`,
        })
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .limit(1);

    if (!row) {
        return null;
    }

    return {
        revenue: row.revenue,
        ordersCount: row.ordersCount,
    } satisfies OrderSummary;
}
