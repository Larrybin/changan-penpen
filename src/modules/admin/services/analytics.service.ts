import { and, desc, eq, gte, type SQL, sql } from "drizzle-orm";
import {
    contentPages,
    coupons,
    creditsHistory,
    customers,
    getDb,
    orders,
    products,
    subscriptions,
    usageDaily,
    user,
} from "@/db";

export interface DashboardMetricsOptions {
    tenantId?: string;
    from?: string;
}

export interface DashboardMetricsResponse {
    totals: {
        revenueCents: number;
        orderCount: number;
        activeSubscriptions: number;
        tenantCount: number;
        totalCredits: number;
    };
    usageTrend: Array<{ date: string; amount: number; unit: string }>;
    latestOrders: Array<{
        id: number;
        amountCents: number;
        currency: string;
        createdAt: string;
        customerEmail: string | null;
        status: string | null;
    }>;
    recentCredits: Array<{
        id: number;
        amount: number;
        createdAt: string;
        customerEmail: string | null;
        type: string | null;
    }>;
    catalogSummary: {
        products: number;
        coupons: number;
        contentPages: number;
    };
}

type DatabaseClient = Awaited<ReturnType<typeof getDb>>;
type TenantCondition = SQL<unknown> | undefined;

async function fetchOrdersSummary(
    db: DatabaseClient,
    tenantCondition: TenantCondition,
) {
    const baseQuery = db
        .select({
            revenueCents: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
            orderCount: sql<number>`count(*)`,
        })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId));

    const builder = tenantCondition
        ? baseQuery.where(tenantCondition)
        : baseQuery;

    const [summary] = await builder;
    return summary;
}

async function fetchActiveSubscriptionSummary(
    db: DatabaseClient,
    tenantCondition: TenantCondition,
) {
    const condition = tenantCondition
        ? and(eq(subscriptions.status, "active"), tenantCondition)
        : eq(subscriptions.status, "active");

    const [summary] = await db
        .select({ active: sql<number>`count(*)` })
        .from(subscriptions)
        .innerJoin(customers, eq(customers.id, subscriptions.customerId))
        .where(condition);

    return summary;
}

async function fetchTotalCredits(
    db: DatabaseClient,
    tenantCondition: TenantCondition,
) {
    const baseQuery = db
        .select({
            totalCredits: sql<number>`coalesce(sum(${customers.credits}), 0)`,
        })
        .from(customers);

    const builder = tenantCondition
        ? baseQuery.where(tenantCondition)
        : baseQuery;

    const [summary] = await builder;
    return summary;
}

async function fetchUsageTrend(
    db: DatabaseClient,
    options: DashboardMetricsOptions,
) {
    const filters = [
        options.tenantId ? eq(usageDaily.userId, options.tenantId) : null,
        options.from ? gte(usageDaily.date, options.from) : null,
    ].filter((clause): clause is SQL<unknown> => clause !== null);

    const condition = filters.length ? and(...filters) : undefined;
    const baseQuery = db
        .select({
            date: usageDaily.date,
            amount: sql<number>`sum(${usageDaily.totalAmount})`,
            unit: sql<string>`max(${usageDaily.unit})`,
        })
        .from(usageDaily)
        .groupBy(usageDaily.date)
        .orderBy(usageDaily.date)
        .limit(30);

    const builder = condition ? baseQuery.where(condition) : baseQuery;
    return builder;
}

async function fetchLatestOrders(
    db: DatabaseClient,
    tenantCondition: TenantCondition,
) {
    const baseQuery = db
        .select({
            id: orders.id,
            amountCents: orders.amountCents,
            currency: orders.currency,
            createdAt: orders.createdAt,
            status: orders.status,
            customerEmail: customers.email,
        })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId))
        .orderBy(desc(orders.createdAt))
        .limit(5);

    const builder = tenantCondition
        ? baseQuery.where(tenantCondition)
        : baseQuery;
    return builder;
}

async function fetchRecentCredits(
    db: DatabaseClient,
    tenantCondition: TenantCondition,
) {
    const baseQuery = db
        .select({
            id: creditsHistory.id,
            amount: creditsHistory.amount,
            createdAt: creditsHistory.createdAt,
            type: creditsHistory.type,
            customerEmail: customers.email,
        })
        .from(creditsHistory)
        .innerJoin(customers, eq(customers.id, creditsHistory.customerId))
        .orderBy(desc(creditsHistory.createdAt))
        .limit(5);

    const builder = tenantCondition
        ? baseQuery.where(tenantCondition)
        : baseQuery;
    return builder;
}

async function fetchCatalogSummary(db: DatabaseClient) {
    const [productCount, couponCount, contentCount] = await Promise.all([
        db.select({ total: sql<number>`count(*)` }).from(products),
        db.select({ total: sql<number>`count(*)` }).from(coupons),
        db.select({ total: sql<number>`count(*)` }).from(contentPages),
    ]);

    return {
        products: productCount[0]?.total ?? 0,
        coupons: couponCount[0]?.total ?? 0,
        contentPages: contentCount[0]?.total ?? 0,
    };
}

async function fetchTenantTotal(db: DatabaseClient) {
    const [summary] = await db
        .select({ total: sql<number>`count(*)` })
        .from(user);
    return summary?.total ?? 0;
}

export async function getDashboardMetrics(
    options: DashboardMetricsOptions = {},
): Promise<DashboardMetricsResponse> {
    const db = await getDb();
    const tenantCondition = options.tenantId
        ? eq(customers.userId, options.tenantId)
        : undefined;

    const [
        ordersSummary,
        subscriptionSummary,
        totalCredits,
        usageRows,
        latestOrdersRows,
        recentCreditsRows,
        catalogSummary,
        tenantTotal,
    ] = await Promise.all([
        fetchOrdersSummary(db, tenantCondition),
        fetchActiveSubscriptionSummary(db, tenantCondition),
        fetchTotalCredits(db, tenantCondition),
        fetchUsageTrend(db, options),
        fetchLatestOrders(db, tenantCondition),
        fetchRecentCredits(db, tenantCondition),
        fetchCatalogSummary(db),
        fetchTenantTotal(db),
    ]);

    return {
        totals: {
            revenueCents: ordersSummary?.revenueCents ?? 0,
            orderCount: ordersSummary?.orderCount ?? 0,
            activeSubscriptions: subscriptionSummary?.active ?? 0,
            tenantCount: tenantTotal,
            totalCredits: totalCredits?.totalCredits ?? 0,
        },
        usageTrend: usageRows.map((row) => ({
            date: row.date,
            amount: Number(row.amount ?? 0),
            unit: row.unit ?? "calls",
        })),
        latestOrders: latestOrdersRows.map((row) => ({
            id: row.id ?? 0,
            amountCents: row.amountCents ?? 0,
            currency: row.currency ?? "USD",
            createdAt: row.createdAt ?? "",
            customerEmail: row.customerEmail,
            status: row.status,
        })),
        recentCredits: recentCreditsRows.map((row) => ({
            id: row.id ?? 0,
            amount: row.amount ?? 0,
            createdAt: row.createdAt ?? "",
            customerEmail: row.customerEmail,
            type: row.type,
        })),
        catalogSummary,
    };
}
