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
import {
    getMultiLevelCache,
    readThroughMultiLevelCache,
} from "@/lib/cache/multi-level-cache";
import { normalizePagination } from "@/modules/admin-shared/utils/pagination";
import type {
    ListTenantsOptions,
    TenantAdminService,
    TenantDetail,
    TenantListResult,
    TenantSummary,
} from "@/modules/tenant-admin/contracts";

interface TenantServiceDependencies {
    getDb: typeof getDb;
}

const defaultDependencies: TenantServiceDependencies = {
    getDb,
};

function createTenantSummaries(
    tenantRows: Array<{
        id: string;
        email: string | null;
        name: string | null;
        createdAt: Date;
        lastSignIn: Date | null;
    }>,
    context: {
        customers: Array<{ userId: string; credits: number; customerId: string }>;
        subscriptions: Array<{ userId: string; status: string | null }>;
        orders: Array<{
            userId: string;
            revenue: number;
            ordersCount: number;
        }>;
        usage: Array<{ userId: string; total: number }>;
    },
): TenantSummary[] {
    return tenantRows.map((tenant) => {
        const customer = context.customers.find(
            (row) => row.userId === tenant.id,
        );
        const subscription = context.subscriptions.find(
            (row) => row.userId === tenant.id,
        );
        const order = context.orders.find((row) => row.userId === tenant.id);
        const usage = context.usage.find((row) => row.userId === tenant.id);

        return {
            ...tenant,
            credits: customer?.credits ?? 0,
            hasCustomer: Boolean(customer?.customerId),
            subscriptionStatus: subscription?.status ?? null,
            ordersCount: order?.ordersCount ?? 0,
            revenueCents: order?.revenue ?? 0,
            totalUsage: usage?.total ?? 0,
        } satisfies TenantSummary;
    });
}

export function createTenantAdminService(
    dependencies: TenantServiceDependencies = defaultDependencies,
): TenantAdminService {
    const listTenants = async (
        options: ListTenantsOptions = {},
    ): Promise<TenantListResult> => {
        const { page: normalizedPage, perPage: normalizedPerPage } =
            normalizePagination(options);
        const page = Math.max(normalizedPage, 1);
        const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
        const offset = (page - 1) * perPage;
        const cacheKey = `list:${page}:${perPage}:${options.search ?? "-"}`;

        const result = await readThroughMultiLevelCache(cacheKey, async () => {
            const db = await dependencies.getDb();
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

            const totalQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(user);
            const totalRows = whereClause
                ? await totalQuery.where(whereClause)
                : await totalQuery;

            const tenantIds = tenantRows.map((row) => row.id);

            if (tenantIds.length === 0) {
                return { data: [], total: 0 } satisfies TenantListResult;
            }

            const [customerRows, subscriptionRows, orderTotals, usageTotals] =
                await Promise.all([
                    db
                        .select({
                            userId: customers.userId,
                            credits: customers.credits,
                            customerId: customers.id,
                        })
                        .from(customers)
                        .where(inArray(customers.userId, tenantIds)),
                    db
                        .select({
                            userId: customers.userId,
                            status: subscriptions.status,
                        })
                        .from(subscriptions)
                        .innerJoin(
                            customers,
                            eq(customers.id, subscriptions.customerId),
                        )
                        .where(inArray(customers.userId, tenantIds)),
                    db
                        .select({
                            userId: customers.userId,
                            revenue: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
                            ordersCount: sql<number>`count(*)`,
                        })
                        .from(orders)
                        .innerJoin(
                            customers,
                            eq(customers.id, orders.customerId),
                        )
                        .where(inArray(customers.userId, tenantIds))
                        .groupBy(customers.userId),
                    db
                        .select({
                            userId: usageDaily.userId,
                            total: sql<number>`coalesce(sum(${usageDaily.totalAmount}), 0)`,
                        })
                        .from(usageDaily)
                        .where(inArray(usageDaily.userId, tenantIds))
                        .groupBy(usageDaily.userId),
                ]);

            const summaries = createTenantSummaries(tenantRows, {
                customers: customerRows,
                subscriptions: subscriptionRows,
                orders: orderTotals,
                usage: usageTotals,
            });

            return {
                data: summaries,
                total: totalRows[0]?.count ?? 0,
            } satisfies TenantListResult;
        }, {
            strategy: "admin.tenants",
        });

        return result.value;
    };

    const getTenantDetail = async (
        userId: string,
    ): Promise<TenantDetail | null> => {
        if (!userId) {
            return null;
        }

        const cache = await getMultiLevelCache();
        const cacheKey = `detail:${userId}`;
        const cached = await cache.getValue(cacheKey, {
            strategy: "admin.tenants",
        });
        if (cached.value !== null) {
            try {
                return JSON.parse(cached.value) as TenantDetail;
            } catch (error) {
                console.warn("[TenantAdmin] Failed to parse cached tenant detail", {
                    userId,
                    error,
                });
            }
        }

        const db = await dependencies.getDb();
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

        const [subscriptionRows, creditRows, usageRows, orderAggregate] =
            await Promise.all([
                customer
                    ? db
                          .select()
                          .from(subscriptions)
                          .where(eq(subscriptions.customerId, customer.id))
                          .orderBy(desc(subscriptions.createdAt))
                    : Promise.resolve([]),
                customer
                    ? db
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
                    : Promise.resolve([]),
                db
                    .select({
                        date: usageDaily.date,
                        total: sql<number>`sum(${usageDaily.totalAmount})`,
                        unit: sql<string>`max(${usageDaily.unit})`,
                    })
                    .from(usageDaily)
                    .where(eq(usageDaily.userId, userId))
                    .groupBy(usageDaily.date)
                    .orderBy(desc(usageDaily.date))
                    .limit(30),
                customer
                    ? db
                          .select({
                              revenue: sql<number>`coalesce(sum(${orders.amountCents}), 0)`,
                              ordersCount: sql<number>`count(*)`,
                          })
                          .from(orders)
                          .where(eq(orders.customerId, customer.id))
                          .limit(1)
                    : Promise.resolve([]),
            ]);

        const orderInfo = Array.isArray(orderAggregate)
            ? orderAggregate[0]
            : undefined;

        const detail: TenantDetail = {
            ...tenant,
            credits: customer?.credits ?? 0,
            hasCustomer: Boolean(customer?.id),
            subscriptionStatus: subscriptionRows[0]?.status ?? null,
            ordersCount: orderInfo?.ordersCount ?? 0,
            revenueCents: orderInfo?.revenue ?? 0,
            totalUsage: usageRows.reduce((acc, row) => acc + row.total, 0),
            creditsHistory: creditRows.map((entry) => ({
                id: entry.id,
                amount: entry.amount,
                type: entry.type,
                createdAt: entry.createdAt,
            })),
            subscriptions: subscriptionRows.map((subscription) => ({
                id: subscription.id,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                canceledAt: subscription.canceledAt,
                createdAt: subscription.createdAt,
                updatedAt: subscription.updatedAt,
            })),
            usage: usageRows.map((entry) => ({
                date: entry.date,
                total: entry.total,
                unit: entry.unit,
            })),
        };

        try {
            await cache.setValue(cacheKey, JSON.stringify(detail), {
                strategy: "admin.tenants",
            });
        } catch (error) {
            console.warn("[TenantAdmin] Failed to cache tenant detail", {
                userId,
                error,
            });
        }

        return detail;
    };

    return { listTenants, getTenantDetail } satisfies TenantAdminService;
}

const defaultService = createTenantAdminService();

export async function listTenants(options: ListTenantsOptions = {}) {
    return defaultService.listTenants(options);
}

export async function getTenantDetail(userId: string) {
    return defaultService.getTenantDetail(userId);
}
