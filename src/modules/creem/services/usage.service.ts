import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { consumeCredits } from "@/modules/billing/services/credits.service";
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

type Database = Awaited<ReturnType<typeof getDb>>;

export type UsageGranularity = "daily" | "weekly" | "monthly";

export interface UsageStatsRow {
    bucket: string;
    feature: string;
    totalAmount: number;
    unit: string;
}

export interface UsageStatsResult {
    granularity: UsageGranularity;
    rows: UsageStatsRow[];
}

export interface UsageStatsOptions {
    features?: string[];
    granularity?: UsageGranularity;
    dbOverride?: Database;
}

export async function recordUsage(
    input: UsageRecordInput,
    dbOverride?: Database,
) {
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

    const db = dbOverride ?? (await getDb());
    const now = new Date();
    const nowIso = now.toISOString();
    const date = nowIso.slice(0, 10); // YYYY-MM-DD

    let newCredits: number | undefined;
    if (input.consumeCredits && input.consumeCredits > 0) {
        const balance = await consumeCredits({
            userId: input.userId,
            amount: input.consumeCredits,
            description: `Usage: ${feature}`,
        });

        newCredits = balance;
    }

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

    if (newCredits !== undefined) {
        await db
            .update(customers)
            .set({ credits: newCredits, updatedAt: nowIso })
            .where(eq(customers.userId, input.userId));
    }

    return { ok: true as const, date, newCredits };
}

export async function getUsageStats(
    userId: string,
    fromDateInclusive: string,
    toDateInclusive: string,
    options?: UsageStatsOptions,
): Promise<UsageStatsResult> {
    const granularity = options?.granularity ?? "daily";
    const db = options?.dbOverride ?? (await getDb());
    const featureFilter = (options?.features ?? [])
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

    let predicate = and(
        eq(usageDaily.userId, userId),
        gte(usageDaily.date, fromDateInclusive),
        lte(usageDaily.date, toDateInclusive),
    );

    if (featureFilter.length > 0) {
        predicate = and(predicate, inArray(usageDaily.feature, featureFilter));
    }

    if (granularity === "daily") {
        const rows = await db
            .select({
                bucket: usageDaily.date,
                feature: usageDaily.feature,
                totalAmount: usageDaily.totalAmount,
                unit: usageDaily.unit,
            })
            .from(usageDaily)
            .where(predicate)
            .orderBy(usageDaily.date, usageDaily.feature);

        return {
            granularity,
            rows: rows.map((row) => ({
                bucket: row.bucket,
                feature: row.feature,
                totalAmount: Number(row.totalAmount ?? 0),
                unit: row.unit,
            })),
        } satisfies UsageStatsResult;
    }

    const periodExpression =
        granularity === "weekly"
            ? sql<string>`strftime('%Y-W%W', ${usageDaily.date})`
            : sql<string>`strftime('%Y-%m', ${usageDaily.date})`;
    const aggregatedAmount = sql<number>`sum(${usageDaily.totalAmount})`;

    const aggregatedRows = await db
        .select({
            bucket: periodExpression,
            feature: usageDaily.feature,
            totalAmount: aggregatedAmount,
            unit: usageDaily.unit,
        })
        .from(usageDaily)
        .where(predicate)
        .groupBy(periodExpression, usageDaily.feature, usageDaily.unit)
        .orderBy(periodExpression, usageDaily.feature);

    return {
        granularity,
        rows: aggregatedRows.map((row) => ({
            bucket: row.bucket,
            feature: row.feature,
            totalAmount: Number(row.totalAmount ?? 0),
            unit: row.unit,
        })),
    } satisfies UsageStatsResult;
}

export async function getUsageDaily(
    userId: string,
    fromDateInclusive: string,
    toDateInclusive: string,
    dbOverride?: Database,
) {
    const result = await getUsageStats(
        userId,
        fromDateInclusive,
        toDateInclusive,
        {
            granularity: "daily",
            dbOverride,
        },
    );

    return result.rows.map((row) => ({
        date: row.bucket,
        feature: row.feature,
        totalAmount: row.totalAmount,
        unit: row.unit,
    }));
}
