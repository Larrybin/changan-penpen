import { desc, eq, sql } from "drizzle-orm";
import { creditsHistory, customers, orders } from "@/db";
import { getDb } from "@/db";
import { normalizePagination } from "../utils/pagination";

export interface ListOrdersOptions {
    page?: number;
    perPage?: number;
    tenantId?: string;
}

export async function listOrders(options: ListOrdersOptions = {}) {
    const db = await getDb();
    const { page: normalizedPage, perPage: normalizedPerPage } =
        normalizePagination(options);
    const page = Math.max(normalizedPage, 1);
    const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
    const offset = (page - 1) * perPage;

    const query = db
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
        .limit(perPage)
        .offset(offset);

    const rows = options.tenantId
        ? await query.where(eq(customers.userId, options.tenantId))
        : await query;

    const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId));

    const totalRows = options.tenantId
        ? await totalQuery.where(eq(customers.userId, options.tenantId))
        : await totalQuery;

    return {
        data: rows,
        total: totalRows[0]?.count ?? 0,
    };
}

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

export interface ListCreditsOptions {
    page?: number;
    perPage?: number;
    tenantId?: string;
}

export async function listCreditsHistory(options: ListCreditsOptions = {}) {
    const db = await getDb();
    const { page: normalizedPage, perPage: normalizedPerPage } =
        normalizePagination(options);
    const page = Math.max(normalizedPage, 1);
    const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
    const offset = (page - 1) * perPage;

    const query = db
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
        .limit(perPage)
        .offset(offset);

    const rows = options.tenantId
        ? await query.where(eq(customers.userId, options.tenantId))
        : await query;

    const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(creditsHistory)
        .innerJoin(customers, eq(customers.id, creditsHistory.customerId));

    const totalRows = options.tenantId
        ? await totalQuery.where(eq(customers.userId, options.tenantId))
        : await totalQuery;

    return {
        data: rows,
        total: totalRows[0]?.count ?? 0,
    };
}
