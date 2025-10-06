import { desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
    creditsHistory,
    customers,
    getDb,
    orders,
    subscriptions,
    usageDaily,
    user,
} from "@/db";
import { normalizePagination } from "../utils/pagination";

export interface ListTenantsOptions {
    page?: number;
    perPage?: number;
    search?: string;
}

export async function listTenants(options: ListTenantsOptions = {}) {
    const db = await getDb();
    const { page: normalizedPage, perPage: normalizedPerPage } =
        normalizePagination(options);
    const page = Math.max(normalizedPage, 1);
    const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
    const offset = (page - 1) * perPage;

    const whereClause = options.search
        ? or(
              like(user.email, `%${options.search}%`),
              like(user.name, `%${options.search}%`),
          )
        : undefined;

    const tenantQuery = db
        .select({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            lastSignIn: user.updatedAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(perPage)
        .offset(offset);

    const tenantRows = whereClause
        ? await tenantQuery.where(whereClause)
        : await tenantQuery;

    const totalQuery = db.select({ count: sql<number>`count(*)` }).from(user);
    const totalRows = whereClause
        ? await totalQuery.where(whereClause)
        : await totalQuery;

    const tenantIds = tenantRows.map((row) => row.id);

    const customerRows = tenantIds.length
        ? await db
              .select({
                  userId: customers.userId,
                  credits: customers.credits,
                  customerId: customers.id,
              })
              .from(customers)
              .where(inArray(customers.userId, tenantIds))
        : [];

    const subscriptionRows = tenantIds.length
        ? await db
              .select({
                  userId: customers.userId,
                  status: subscriptions.status,
              })
              .from(subscriptions)
              .innerJoin(customers, eq(customers.id, subscriptions.customerId))
              .where(inArray(customers.userId, tenantIds))
        : [];

    const orderTotals = tenantIds.length
        ? await db
              .select({
                  userId: customers.userId,
                  revenue: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
                  ordersCount: sql<number>`count(*)`,
              })
              .from(orders)
              .innerJoin(customers, eq(customers.id, orders.customerId))
              .where(inArray(customers.userId, tenantIds))
              .groupBy(customers.userId)
        : [];

    const usageTotals = tenantIds.length
        ? await db
              .select({
                  userId: usageDaily.userId,
                  total: sql<number>`coalesce(sum(${usageDaily.totalAmount}), 0)`,
              })
              .from(usageDaily)
              .where(inArray(usageDaily.userId, tenantIds))
              .groupBy(usageDaily.userId)
        : [];

    const tenantSummaries = tenantRows.map((tenant) => {
        const customer = customerRows.find((row) => row.userId === tenant.id);
        const subscription = subscriptionRows.find(
            (row) => row.userId === tenant.id,
        );
        const order = orderTotals.find((row) => row.userId === tenant.id);
        const usage = usageTotals.find((row) => row.userId === tenant.id);

        return {
            ...tenant,
            credits: customer?.credits ?? 0,
            hasCustomer: Boolean(customer?.customerId),
            subscriptionStatus: subscription?.status ?? null,
            ordersCount: order?.ordersCount ?? 0,
            revenueCents: order?.revenue ?? 0,
            totalUsage: usage?.total ?? 0,
        };
    });

    return {
        data: tenantSummaries,
        total: totalRows[0]?.count ?? 0,
    };
}

export async function getTenantDetail(userId: string) {
    const db = await getDb();
    const [tenant] = await db
        .select({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            lastSignIn: user.updatedAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    if (!tenant) {
        return null;
    }

    const [customer] = await db
        .select({
            id: customers.id,
            credits: customers.credits,
        })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);

    const subscription = customer
        ? await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.customerId, customer.id))
              .orderBy(desc(subscriptions.createdAt))
        : [];

    const credits = customer
        ? await db
              .select({
                  id: creditsHistory.id,
                  amount: creditsHistory.amount,
                  type: creditsHistory.type,
                  createdAt: creditsHistory.createdAt,
              })
              .from(creditsHistory)
              .where(eq(creditsHistory.customerId, customer.id))
              .orderBy(desc(creditsHistory.createdAt))
              .limit(20)
        : [];

    const usage = await db
        .select({
            date: usageDaily.date,
            total: sql<number>`sum(${usageDaily.totalAmount})`,
            unit: sql<string>`max(${usageDaily.unit})`,
        })
        .from(usageDaily)
        .where(eq(usageDaily.userId, userId))
        .groupBy(usageDaily.date)
        .orderBy(desc(usageDaily.date))
        .limit(30);

    return {
        ...tenant,
        credits: customer?.credits ?? 0,
        creditsHistory: credits,
        subscriptions: subscription,
        usage,
    };
}
