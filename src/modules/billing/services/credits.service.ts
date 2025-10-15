import "server-only";

import { and, asc, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { FREE_MONTHLY_CREDITS } from "@/constants/credits.constant";
import { CREDIT_TRANSACTION_TYPE, creditTransactions, getDb, user } from "@/db";
import type { CreditTransactionType } from "@/modules/billing/schemas/credits.schema";

const oneMonthMs = 1000 * 60 * 60 * 24 * 30;

const shouldRefreshCredits = (
    lastRefreshAt: Date | null,
    currentTime: Date,
) => {
    if (!lastRefreshAt) {
        return true;
    }

    return currentTime.getTime() - lastRefreshAt.getTime() >= oneMonthMs;
};

const toDate = (value: Date | number | string | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

async function processExpiredCredits(userId: string, currentTime: Date) {
    const db = await getDb();

    const expiredTransactions = await db
        .select()
        .from(creditTransactions)
        .where(
            and(
                eq(creditTransactions.userId, userId),
                lt(creditTransactions.expirationDate, currentTime),
                isNull(creditTransactions.expirationDateProcessedAt),
                gt(creditTransactions.remainingAmount, 0),
            ),
        )
        .orderBy(
            desc(
                sql`CASE WHEN ${creditTransactions.type} = ${
                    CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH
                } THEN 1 ELSE 0 END`,
            ),
            asc(creditTransactions.createdAt),
        );

    if (!expiredTransactions.length) {
        return;
    }

    for (const transaction of expiredTransactions) {
        await db
            .update(creditTransactions)
            .set({
                expirationDateProcessedAt: currentTime,
                remainingAmount: 0,
            })
            .where(eq(creditTransactions.id, transaction.id));

        if (transaction.remainingAmount > 0) {
            await db
                .update(user)
                .set({
                    currentCredits: sql`${user.currentCredits} - ${transaction.remainingAmount}`,
                    updatedAt: new Date(),
                })
                .where(eq(user.id, userId));
        }
    }
}

export async function logCreditTransaction(params: {
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description: string;
    expirationDate?: Date | null;
    paymentIntentId?: string | null;
}) {
    const db = await getDb();

    await db.insert(creditTransactions).values({
        userId: params.userId,
        amount: params.amount,
        remainingAmount: params.amount,
        type: params.type,
        description: params.description,
        expirationDate: params.expirationDate ?? null,
        paymentIntentId: params.paymentIntentId ?? null,
    });
}

export async function addCredits({
    userId,
    amount,
    description,
    type = CREDIT_TRANSACTION_TYPE.PURCHASE,
    expirationDate,
    paymentIntentId,
}: {
    userId: string;
    amount: number;
    description: string;
    type?: CreditTransactionType;
    expirationDate?: Date | null;
    paymentIntentId?: string | null;
}) {
    const db = await getDb();

    await db
        .update(user)
        .set({
            currentCredits: sql`${user.currentCredits} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

    await logCreditTransaction({
        userId,
        amount,
        type,
        description,
        expirationDate,
        paymentIntentId,
    });
}

export async function consumeCredits({
    userId,
    amount,
    description,
}: {
    userId: string;
    amount: number;
    description: string;
}) {
    const db = await getDb();

    const current = await db
        .select({ currentCredits: user.currentCredits })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    const balance = current[0]?.currentCredits ?? 0;
    if (balance < amount) {
        throw new Error("Insufficient credits");
    }

    const activeTransactions = await db
        .select({
            id: creditTransactions.id,
            remainingAmount: creditTransactions.remainingAmount,
        })
        .from(creditTransactions)
        .where(
            and(
                eq(creditTransactions.userId, userId),
                gt(creditTransactions.remainingAmount, 0),
                or(
                    isNull(creditTransactions.expirationDateProcessedAt),
                    gt(
                        creditTransactions.expirationDateProcessedAt,
                        new Date(),
                    ),
                ),
                or(
                    isNull(creditTransactions.expirationDate),
                    gt(creditTransactions.expirationDate, new Date()),
                ),
            ),
        )
        .orderBy(asc(creditTransactions.createdAt));

    let remainingToDeduct = amount;

    for (const transaction of activeTransactions) {
        if (remainingToDeduct <= 0) break;

        const deductFromThis = Math.min(
            transaction.remainingAmount,
            remainingToDeduct,
        );

        await db
            .update(creditTransactions)
            .set({
                remainingAmount: transaction.remainingAmount - deductFromThis,
                updatedAt: new Date(),
            })
            .where(eq(creditTransactions.id, transaction.id));

        remainingToDeduct -= deductFromThis;
    }

    await db
        .update(user)
        .set({
            currentCredits: sql`${user.currentCredits} - ${amount}`,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

    await logCreditTransaction({
        userId,
        amount: -amount,
        type: CREDIT_TRANSACTION_TYPE.USAGE,
        description,
    });
}

export async function addFreeMonthlyCreditsIfNeeded(userId: string) {
    const db = await getDb();
    const now = new Date();

    const result = await db
        .select({
            lastRefreshAt: user.lastCreditRefreshAt,
            currentCredits: user.currentCredits,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    const lastRefreshAt = toDate(result[0]?.lastRefreshAt);
    if (!shouldRefreshCredits(lastRefreshAt, now)) {
        return result[0]?.currentCredits ?? 0;
    }

    await processExpiredCredits(userId, now);

    await addCredits({
        userId,
        amount: FREE_MONTHLY_CREDITS,
        type: CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
        description: "Free monthly credits",
        expirationDate: new Date(now.getTime() + oneMonthMs),
    });

    await db
        .update(user)
        .set({
            lastCreditRefreshAt: now,
            updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

    const updated = await db
        .select({ currentCredits: user.currentCredits })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    return updated[0]?.currentCredits ?? 0;
}

export async function getCreditTransactions({
    userId,
    page = 1,
    limit = 10,
}: {
    userId: string;
    page?: number;
    limit?: number;
}) {
    const db = await getDb();

    const transactions = await db
        .select({
            id: creditTransactions.id,
            amount: creditTransactions.amount,
            remainingAmount: creditTransactions.remainingAmount,
            type: creditTransactions.type,
            description: creditTransactions.description,
            expirationDate: creditTransactions.expirationDate,
            paymentIntentId: creditTransactions.paymentIntentId,
            createdAt: creditTransactions.createdAt,
            updatedAt: creditTransactions.updatedAt,
        })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId));

    return {
        transactions: transactions.map((item) => ({
            ...item,
            expirationDate: toDate(item.expirationDate),
            createdAt: toDate(item.createdAt),
            updatedAt: toDate(item.updatedAt),
        })),
        pagination: {
            total: count,
            pages: Math.ceil(count / limit),
            current: page,
        },
    };
}

export async function hasEnoughCredits({
    userId,
    requiredCredits,
}: {
    userId: string;
    requiredCredits: number;
}) {
    const db = await getDb();
    const rows = await db
        .select({ currentCredits: user.currentCredits })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    return (rows[0]?.currentCredits ?? 0) >= requiredCredits;
}
