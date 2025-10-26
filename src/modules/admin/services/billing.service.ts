import { desc, eq, sql } from "drizzle-orm";
import { creditsHistory, customers, getDb, orders } from "@/db";
import {
    createPaginatedQuery,
    type FilterableBuilder,
    type TenantPaginationOptions,
} from "./paginated-query";

export interface ListOrdersOptions extends TenantPaginationOptions {}

const applyTenantScope = <TResult>(
    builder: FilterableBuilder<TResult>,
    tenantId: string,
) => {
    const filterable = builder as FilterableBuilder<TResult> & {
        where?: (clause: unknown) => FilterableBuilder<TResult>;
    };

    return filterable.where?.(eq(customers.userId, tenantId)) ?? builder;
};

export const listOrders = createPaginatedQuery<
    ListOrdersOptions,
    {
        id: number;
        amountCents: number;
        currency: string;
        status: string;
        createdAt: string;
        customerEmail: string | null;
        userId: string;
    }
>({
    buildBaseQuery: (db, { limit, offset }) =>
        db
            .select({
                id: orders.id,
                amountCents: orders.amountCents,
                currency: orders.currency,
                status: orders.status,
                createdAt: orders.createdAt,
                customerEmail: customers.email,
                userId: customers.userId,
            })
            .from(orders)
            .innerJoin(customers, eq(customers.id, orders.customerId))
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset),
    buildTotalQuery: (db) =>
        db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .innerJoin(customers, eq(customers.id, orders.customerId)),
    applyTenantFilter: applyTenantScope,
});

export async function getOrderById(id: number) {
    const db = await getDb();
    const rows = await db
        .select({
            id: orders.id,
            amountCents: orders.amountCents,
            currency: orders.currency,
            status: orders.status,
            createdAt: orders.createdAt,
            customerEmail: customers.email,
            userId: customers.userId,
        })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .where(eq(orders.id, id))
        .limit(1);

    return rows[0] ?? null;
}

export interface ListCreditsOptions extends TenantPaginationOptions {}

export const listCreditsHistory = createPaginatedQuery<
    ListCreditsOptions,
    {
        id: number;
        amount: number;
        type: string;
        description: string | null;
        createdAt: string;
        customerEmail: string | null;
        userId: string;
    }
>({
    buildBaseQuery: (db, { limit, offset }) =>
        db
            .select({
                id: creditsHistory.id,
                amount: creditsHistory.amount,
                type: creditsHistory.type,
                description: creditsHistory.description,
                createdAt: creditsHistory.createdAt,
                customerEmail: customers.email,
                userId: customers.userId,
            })
            .from(creditsHistory)
            .innerJoin(customers, eq(customers.id, creditsHistory.customerId))
            .orderBy(desc(creditsHistory.createdAt))
            .limit(limit)
            .offset(offset),
    buildTotalQuery: (db) =>
        db
            .select({ count: sql<number>`count(*)` })
            .from(creditsHistory)
            .innerJoin(customers, eq(customers.id, creditsHistory.customerId)),
    applyTenantFilter: applyTenantScope,
});
