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

export async function getDashboardMetrics(
    options: DashboardMetricsOptions = {},
): Promise<DashboardMetricsResponse> {
    const db = await getDb();
    const tenantCondition = options.tenantId
        ? eq(customers.userId, options.tenantId)
        : undefined;

    const ordersQuery = db
        .select({
            revenueCents: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
            orderCount: sql<number>`count(*)`,
        })
        .from(orders)
        .innerJoin(customers, eq(customers.id, orders.customerId));

    const ordersResult = tenantCondition
        ? await ordersQuery.where(tenantCondition)
        : await ordersQuery;
    const ordersSummary = ordersResult[0];

    const subscriptionQuery = db
        .select({ active: sql<number>`count(*)` })
        .from(subscriptions)
        .innerJoin(customers, eq(customers.id, subscriptions.customerId));

    const subscriptionResult = tenantCondition
        ? await subscriptionQuery.where(
              and(eq(subscriptions.status, "active"), tenantCondition),
          )
        : await subscriptionQuery.where(eq(subscriptions.status, "active"));
    const subscriptionSummary = subscriptionResult[0];

    const tenantSummary = await db
        .select({ total: sql<number>`count(*)` })
        .from(user);

    const creditsQuery = db
        .select({
            totalCredits: sql<number>`coalesce(sum(${customers.credits}), 0)`,
        })
        .from(customers);

    const creditResult = tenantCondition
        ? await creditsQuery.where(tenantCondition)
        : await creditsQuery;
    const creditSummary = creditResult[0];

    const usageFilters: SQL[] = [];
    if (options.tenantId) {
        usageFilters.push(eq(usageDaily.userId, options.tenantId));
    }
    if (options.from) {
        usageFilters.push(gte(usageDaily.date, options.from));
    }

    const usageWhere = usageFilters.length ? and(...usageFilters) : undefined;

    const usageRowsQuery = db
        .select({
            date: usageDaily.date,
            amount: sql<number>`sum(${usageDaily.totalAmount})`,
            unit: sql<string>`max(${usageDaily.unit})`,
        })
        .from(usageDaily)
        .groupBy(usageDaily.date)
        .orderBy(usageDaily.date)
        .limit(30);

    const usageRows = usageWhere
        ? await usageRowsQuery.where(usageWhere)
        : await usageRowsQuery;

    const latestOrdersQuery = db
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

    const latestOrdersRows = tenantCondition
        ? await latestOrdersQuery.where(tenantCondition)
        : await latestOrdersQuery;

    const recentCreditsQuery = db
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

    const recentCreditsRows = tenantCondition
        ? await recentCreditsQuery.where(tenantCondition)
        : await recentCreditsQuery;

    const productCount = await db
        .select({ total: sql<number>`count(*)` })
        .from(products);
    const couponCount = await db
        .select({ total: sql<number>`count(*)` })
        .from(coupons);
    const contentCount = await db
        .select({ total: sql<number>`count(*)` })
        .from(contentPages);

    return {
        totals: {
            revenueCents: ordersSummary?.revenueCents ?? 0,
            orderCount: ordersSummary?.orderCount ?? 0,
            activeSubscriptions: subscriptionSummary?.active ?? 0,
            tenantCount: tenantSummary[0]?.total ?? 0,
            totalCredits: creditSummary?.totalCredits ?? 0,
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
        catalogSummary: {
            products: productCount[0]?.total ?? 0,
            coupons: couponCount[0]?.total ?? 0,
            contentPages: contentCount[0]?.total ?? 0,
        },
    };
}
