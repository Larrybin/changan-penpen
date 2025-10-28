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

async function fetchDashboardTotals(
    db: DatabaseClient,
    options: DashboardMetricsOptions,
) {
    const tenantOrderWhere = options.tenantId
        ? sql`WHERE ${customers.userId} = ${options.tenantId}`
        : sql``;
    const tenantActiveWhere = options.tenantId
        ? sql`AND ${customers.userId} = ${options.tenantId}`
        : sql``;
    const tenantCreditsWhere = options.tenantId
        ? sql`WHERE ${customers.userId} = ${options.tenantId}`
        : sql``;

    const [row] = await db
        .select({
            revenueCents: sql<number>`(
                SELECT coalesce(sum(${orders.amountCents}), 0)
                FROM ${orders}
                INNER JOIN ${customers} ON ${customers.id} = ${orders.customerId}
                ${tenantOrderWhere}
            )`,
            orderCount: sql<number>`(
                SELECT coalesce(count(*), 0)
                FROM ${orders}
                INNER JOIN ${customers} ON ${customers.id} = ${orders.customerId}
                ${tenantOrderWhere}
            )`,
            activeSubscriptions: sql<number>`(
                SELECT coalesce(count(*), 0)
                FROM ${subscriptions}
                INNER JOIN ${customers} ON ${customers.id} = ${subscriptions.customerId}
                WHERE ${subscriptions.status} = 'active'
                ${tenantActiveWhere}
            )`,
            totalCredits: sql<number>`(
                SELECT coalesce(sum(${customers.credits}), 0)
                FROM ${customers}
                ${tenantCreditsWhere}
            )`,
            tenantCount: sql<number>`(
                SELECT coalesce(count(*), 0)
                FROM ${user}
            )`,
        })
        .from(sql`(SELECT 1) AS dashboard_totals`);

    return {
        revenueCents: Number(row?.revenueCents ?? 0),
        orderCount: Number(row?.orderCount ?? 0),
        activeSubscriptions: Number(row?.activeSubscriptions ?? 0),
        totalCredits: Number(row?.totalCredits ?? 0),
        tenantCount: Number(row?.tenantCount ?? 0),
    } as const;
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
    return builder.all();
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
    return builder.all();
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
    return builder.all();
}

async function fetchCatalogSummary(db: DatabaseClient) {
    const [row] = await db
        .select({
            products: sql<number>`(SELECT count(*) FROM ${products})`,
            coupons: sql<number>`(SELECT count(*) FROM ${coupons})`,
            contentPages: sql<number>`(SELECT count(*) FROM ${contentPages})`,
        })
        .from(sql`(SELECT 1) AS catalog_totals`);

    return {
        products: Number(row?.products ?? 0),
        coupons: Number(row?.coupons ?? 0),
        contentPages: Number(row?.contentPages ?? 0),
    };
}

export async function getDashboardMetrics(
    options: DashboardMetricsOptions = {},
): Promise<DashboardMetricsResponse> {
    const db = await getDb();
    const tenantCondition = options.tenantId
        ? eq(customers.userId, options.tenantId)
        : undefined;

    const [
        totals,
        usageRows,
        latestOrdersRows,
        recentCreditsRows,
        catalogSummary,
    ] = await Promise.all([
        fetchDashboardTotals(db, options),
        fetchUsageTrend(db, options),
        fetchLatestOrders(db, tenantCondition),
        fetchRecentCredits(db, tenantCondition),
        fetchCatalogSummary(db),
    ]);

    return {
        totals: {
            revenueCents: totals.revenueCents,
            orderCount: totals.orderCount,
            activeSubscriptions: totals.activeSubscriptions,
            tenantCount: totals.tenantCount,
            totalCredits: totals.totalCredits,
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
