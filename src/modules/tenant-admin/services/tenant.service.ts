import { desc, eq, inArray, like, sql } from "drizzle-orm";

import {
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
import { runUserDirectoryQuery } from "@/modules/admin/utils/query-factory";
import {
    type CustomerHistoryRecord,
    fetchCustomerWithHistory,
    fetchOrderSummary,
    fetchUsageSummary,
    fetchUserCore,
    normalizePagination,
    type OrderSummary,
    type UserCoreRecord,
} from "@/modules/admin-shared";
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
        createdAt: Date | string;
        lastSignIn: Date | string | null;
    }>,
    context: {
        customers: Array<{
            userId: string;
            credits: number;
            customerId: number;
        }>;
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

function buildTenantDetail(
    tenant: UserCoreRecord,
    customerHistory: CustomerHistoryRecord,
    usage: Array<{ date: Date | string; total: number; unit: string | null }>,
    order: OrderSummary | null,
): TenantDetail {
    return {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        createdAt: tenant.createdAt,
        lastSignIn: tenant.updatedAt,
        credits: customerHistory.customer?.credits ?? 0,
        hasCustomer: Boolean(customerHistory.customer?.id),
        subscriptionStatus: customerHistory.subscriptions[0]?.status ?? null,
        ordersCount: order?.ordersCount ?? 0,
        revenueCents: order?.revenue ?? 0,
        creditsHistory: customerHistory.credits.map((entry) => ({
            id: String(entry.id),
            amount: entry.amount,
            type: entry.type,
            createdAt: entry.createdAt,
        })),
        subscriptions: customerHistory.subscriptions.map((subscription) => ({
            id: String(subscription.id),
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            canceledAt: subscription.canceledAt,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        })),
        usage: usage.map((entry) => ({
            date: entry.date,
            total: entry.total,
            unit: entry.unit,
        })),
    } satisfies TenantDetail;
}

async function readCachedTenantDetail(
    cacheKey: string,
): Promise<TenantDetail | null> {
    const cache = await getMultiLevelCache();
    const cached = await cache.getValue(cacheKey, {
        strategy: "admin.tenants",
    });
    if (cached.value === null) {
        return null;
    }
    try {
        return JSON.parse(cached.value) as TenantDetail;
    } catch (error) {
        console.warn("[TenantAdmin] Failed to parse cached tenant detail", {
            cacheKey,
            error,
        });
        return null;
    }
}

async function writeTenantDetailToCache(
    cacheKey: string,
    detail: TenantDetail,
) {
    const cache = await getMultiLevelCache();
    await cache.setValue(cacheKey, JSON.stringify(detail), {
        strategy: "admin.tenants",
    });
}

export function createTenantAdminService(
    dependencies: TenantServiceDependencies = defaultDependencies,
): TenantAdminService {
    const listTenants = async (
        options: ListTenantsOptions = {},
    ): Promise<TenantListResult> => {
        const { page, perPage } = normalizePagination(options);
        const cacheKey = `list:${page}:${perPage}:${options.search ?? "-"}`;

        const result = await readThroughMultiLevelCache(
            cacheKey,
            async () => {
                const db = await dependencies.getDb();
                const { rows: tenantRows, total } = await runUserDirectoryQuery(
                    {
                        db,
                        page,
                        perPage,
                        filters: options.search
                            ? [
                                  like(user.email, `%${options.search}%`),
                                  like(user.name, `%${options.search}%`),
                              ]
                            : undefined,
                        operator: "or",
                        buildBaseQuery: async (
                            client,
                            { limit, offset, where },
                        ) => {
                            const query = client
                                .select({
                                    id: user.id,
                                    email: user.email,
                                    name: user.name,
                                    createdAt: user.createdAt,
                                    lastSignIn: user.updatedAt,
                                })
                                .from(user)
                                .orderBy(desc(user.createdAt))
                                .limit(limit)
                                .offset(offset);

                            return where
                                ? await query.where(where)
                                : await query;
                        },
                    },
                );

                const tenantIds = tenantRows.map((row) => row.id);

                if (tenantIds.length === 0) {
                    return { data: [], total: 0 } satisfies TenantListResult;
                }

                const [
                    customerRows,
                    subscriptionRows,
                    orderTotals,
                    usageTotals,
                ] = await Promise.all([
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
                    total,
                } satisfies TenantListResult;
            },
            {
                strategy: "admin.tenants",
            },
        );

        return result.value;
    };

    const getTenantDetail = async (
        userId: string,
    ): Promise<TenantDetail | null> => {
        if (!userId) {
            return null;
        }

        const cacheKey = `detail:${userId}`;
        const cached = await readCachedTenantDetail(cacheKey);
        if (cached) {
            return cached;
        }

        const db = await dependencies.getDb();
        const tenant = await fetchUserCore(db, userId);
        if (!tenant) {
            return null;
        }

        const customerHistory = await fetchCustomerWithHistory(db, userId);
        const usage = await fetchUsageSummary(db, userId);
        const order = await fetchOrderSummary(
            db,
            customerHistory.customer?.id ?? null,
        );
        const detail = buildTenantDetail(tenant, customerHistory, usage, order);

        try {
            await writeTenantDetailToCache(cacheKey, detail);
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
