import { and, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/modules/creem/schemas/billing.schema";
import { usageDaily, usageEvents } from "@/modules/creem/schemas/usage.schema";

export type UsageRecordInput = {
    userId: string;
    feature: string; // 业务功能名，例如 "ai.generate", "storage.upload"
    amount: number; // 使用量（必须为正数）
    unit: string; // 单位，如 "tokens", "calls", "MB"
    metadata?: Record<string, unknown>;
    consumeCredits?: number; // 可选：同时扣减积分
};

export async function recordUsage(input: UsageRecordInput) {
    const feature = input.feature?.trim();
    const unit = input.unit?.trim();

    if (!feature) {
        throw new Error("Feature is required for usage records");
    }

    if (!unit) {
        throw new Error("Unit is required for usage records");
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
        throw new Error("Usage amount must be a positive number");
    }

    const db = await getDb();
    const now = new Date();
    const nowIso = now.toISOString();
    const date = nowIso.slice(0, 10); // YYYY-MM-DD

    await db.insert(usageEvents).values({
        userId: input.userId,
        feature,
        amount: input.amount,
        unit,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdAt: nowIso,
    });

    await db
        .insert(usageDaily)
        .values({
            userId: input.userId,
            date,
            feature,
            totalAmount: input.amount,
            unit,
            createdAt: nowIso,
            updatedAt: nowIso,
        })
        .onConflictDoUpdate({
            target: [usageDaily.userId, usageDaily.feature, usageDaily.date],
            set: {
                totalAmount: sql`${usageDaily.totalAmount} + ${input.amount}`,
                unit,
                updatedAt: nowIso,
            },
        });

    let newCredits: number | undefined;
    if (input.consumeCredits && input.consumeCredits > 0) {
        newCredits = await decrementCredits(input.userId, input.consumeCredits);
    }

    return { ok: true as const, date, newCredits };
}

export async function decrementCredits(userId: string, amount: number) {
    if (amount <= 0) return undefined;
    const db = await getDb();
    const rows = await db
        .select({ id: customers.id, credits: customers.credits })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
    if (rows.length === 0) throw new Error("Customer not found for user");
    const now = new Date().toISOString();
    const left = Math.max(0, (rows[0].credits || 0) - amount);
    await db
        .update(customers)
        .set({ credits: left, updatedAt: now })
        .where(eq(customers.id, rows[0].id));
    return left;
}

export async function getUsageDaily(
    userId: string,
    fromDateInclusive: string,
    toDateInclusive: string,
) {
    const db = await getDb();
    // 简化处理：直接查询区间的聚合表
    const rows = await db
        .select({
            date: usageDaily.date,
            feature: usageDaily.feature,
            totalAmount: usageDaily.totalAmount,
            unit: usageDaily.unit,
        })
        .from(usageDaily)
        .where(
            and(
                eq(usageDaily.userId, userId),
                gte(usageDaily.date, fromDateInclusive),
                lte(usageDaily.date, toDateInclusive),
            ),
        )
        .orderBy(usageDaily.date);

    return rows;
}
