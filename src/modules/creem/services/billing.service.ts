import { and, eq } from "drizzle-orm";
import { CREDIT_TRANSACTION_TYPE, getDb } from "@/db";
import { addCredits } from "@/modules/billing/services/credits.service";
import type {
    CreemCustomer,
    CreemSubscription,
} from "@/modules/creem/models/creem.types";
import {
    creditsHistory,
    customers,
    subscriptions,
} from "@/modules/creem/schemas/billing.schema";

export async function createOrUpdateCustomer(
    creemCustomer: CreemCustomer,
    userId: string,
) {
    const db = await getDb();
    const now = new Date().toISOString();

    const baseValues = {
        userId,
        creemCustomerId: creemCustomer.id,
        email: creemCustomer.email,
        name: creemCustomer.name,
        country: creemCustomer.country,
        credits: 0,
        createdAt: now,
        updatedAt: now,
    } as const;

    const updateSet = {
        userId,
        creemCustomerId: creemCustomer.id,
        email: creemCustomer.email,
        name: creemCustomer.name,
        country: creemCustomer.country,
        updatedAt: now,
    } as const;

    const resultByCreem = await db
        .insert(customers)
        .values(baseValues)
        .onConflictDoUpdate({
            target: [customers.creemCustomerId],
            set: updateSet,
        })
        .returning({ id: customers.id });

    if (resultByCreem.length > 0) {
        return resultByCreem[0].id;
    }

    const resultByUser = await db
        .insert(customers)
        .values(baseValues)
        .onConflictDoUpdate({
            target: [customers.userId],
            set: updateSet,
        })
        .returning({ id: customers.id });

    if (resultByUser.length > 0) {
        return resultByUser[0].id;
    }

    const inserted = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
            and(
                eq(customers.userId, userId),
                eq(customers.creemCustomerId, creemCustomer.id),
            ),
        )
        .limit(1);

    if (!inserted[0]) {
        throw new Error("Failed to create or update customer record");
    }

    return inserted[0].id;
}

export async function createOrUpdateSubscription(
    creemSubscription: CreemSubscription,
    customerId: number,
) {
    const db = await getDb();
    const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.creemSubscriptionId, creemSubscription.id))
        .limit(1);
    const now = new Date().toISOString();

    const productId =
        typeof creemSubscription.product === "string"
            ? creemSubscription.product
            : creemSubscription.product?.id;

    const payload = {
        customerId,
        creemProductId: productId,
        status: creemSubscription.status,
        currentPeriodStart: creemSubscription.current_period_start_date,
        currentPeriodEnd: creemSubscription.current_period_end_date,
        canceledAt: creemSubscription.canceled_at || null,
        metadata: creemSubscription.metadata
            ? JSON.stringify(creemSubscription.metadata)
            : null,
        updatedAt: now,
    } as const;

    if (existing.length > 0) {
        await db
            .update(subscriptions)
            .set(payload)
            .where(eq(subscriptions.id, existing[0].id));
        return existing[0].id;
    }

    await db.insert(subscriptions).values({
        ...payload,
        creemSubscriptionId: creemSubscription.id,
        createdAt: now,
    });
    const inserted = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.creemSubscriptionId, creemSubscription.id))
        .limit(1);
    return inserted[0].id;
}

export async function addCreditsToCustomer(
    customerId: number,
    credits: number,
    creemOrderId?: string,
    description?: string,
) {
    const db = await getDb();
    if (creemOrderId) {
        const exists = await db
            .select({ id: creditsHistory.id })
            .from(creditsHistory)
            .where(eq(creditsHistory.creemOrderId, creemOrderId))
            .limit(1);
        if (exists.length > 0) {
            const current = await db
                .select({ credits: customers.credits })
                .from(customers)
                .where(eq(customers.id, customerId))
                .limit(1);
            return current[0]?.credits || 0;
        }
    }

    const userRow = await db
        .select({
            credits: customers.credits,
            userId: customers.userId,
        })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);
    if (userRow.length === 0) throw new Error("Customer not found");
    const now = new Date().toISOString();
    const newCredits = (userRow[0].credits || 0) + credits;

    await db
        .update(customers)
        .set({ credits: newCredits, updatedAt: now })
        .where(eq(customers.id, customerId));

    if (userRow[0].userId) {
        await addCredits({
            userId: userRow[0].userId,
            amount: credits,
            description: description || "Credits purchase",
            type: CREDIT_TRANSACTION_TYPE.PURCHASE,
            paymentIntentId: creemOrderId ?? null,
        });
    }

    await db.insert(creditsHistory).values({
        customerId,
        amount: credits,
        type: "add",
        description: description || "Credits purchase",
        creemOrderId: creemOrderId || null,
        createdAt: now,
    });

    return newCredits;
}

export async function getCustomerIdByUserId(userId: string) {
    const db = await getDb();
    const rows = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);
    return rows[0]?.id ?? null;
}
