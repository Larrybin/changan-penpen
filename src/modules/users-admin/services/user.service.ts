import { desc, eq, like, sql } from "drizzle-orm";

import { config } from "@/config";
import {
    creditsHistory,
    creditTransactions,
    customers,
    getDb,
    subscriptions as subscriptionTable,
    usageDaily,
    user,
} from "@/db";
import { getAdminAccessConfig } from "@/modules/admin/utils/admin-access";
import { computeWithAdminCache } from "@/modules/admin/utils/cache";
import { runPaginatedQuery } from "@/modules/admin/utils/query-factory";
import { normalizePagination } from "@/modules/admin-shared/utils/pagination";
import type {
    AdminUserService,
    ListUsersOptions,
    ListUsersResult,
} from "@/modules/users-admin/contracts";
import type {
    AdminUserDetail,
    AdminUserRole,
    AdminUserTransaction,
} from "@/modules/users-admin/models";

const toNullableString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? new Date(value).toISOString() : null;
    }

    if (typeof value === "string") {
        return value;
    }

    return null;
};

const resolveRole = (
    email: string | null | undefined,
    adminEmails: Set<string>,
): AdminUserRole => {
    if (!email) {
        return "user";
    }

    return adminEmails.has(email.toLowerCase()) ? "admin" : "user";
};

const resolveStatus = (emailVerified: boolean | null | undefined) =>
    emailVerified ? "active" : "inactive";

type DbClient = Awaited<ReturnType<typeof getDb>>;

type CustomerRecord = Pick<
    typeof customers.$inferSelect,
    "id" | "credits" | "createdAt" | "updatedAt"
>;

type CreditHistoryRecord = Pick<
    typeof creditsHistory.$inferSelect,
    "id" | "amount" | "type" | "description" | "createdAt"
>;

type SubscriptionRecord = Pick<
    typeof subscriptionTable.$inferSelect,
    | "id"
    | "status"
    | "currentPeriodStart"
    | "currentPeriodEnd"
    | "canceledAt"
    | "createdAt"
    | "updatedAt"
>;

interface CustomerBundle {
    customer: CustomerRecord | null;
    credits: CreditHistoryRecord[];
    subscriptions: SubscriptionRecord[];
}

type QueryExecutor = <T>(operation: () => Promise<T>) => Promise<T>;

const directQueryExecutor: QueryExecutor = (operation) =>
    Promise.resolve().then(operation);

const resolveAdminEmailSet = async () => {
    const { allowedEmails } = await getAdminAccessConfig();
    return new Set(allowedEmails.map((email) => email.toLowerCase()));
};

const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });

function runWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number | undefined,
): Promise<T> {
    if (!Number.isFinite(timeoutMs) || !timeoutMs || timeoutMs <= 0) {
        return Promise.resolve().then(operation);
    }

    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(
                new Error(
                    `AdminUserService query timed out after ${timeoutMs}ms`,
                ),
            );
        }, timeoutMs);

        const finalize = <U>(callback: () => U): U => {
            clearTimeout(timer);
            return callback();
        };

        Promise.resolve()
            .then(operation)
            .then((value) => finalize(() => resolve(value)))
            .catch((error) => finalize(() => reject(error)));
    });
}

interface QueryRetryPolicy {
    timeoutMs?: number;
    retryAttempts: number;
    retryDelayMs?: number;
}

async function executeWithPolicies<T>(
    operation: () => Promise<T>,
    policy: QueryRetryPolicy,
): Promise<T> {
    const attempts = Math.max(1, Math.floor(policy.retryAttempts ?? 0) + 1);
    const delayMs =
        policy.retryDelayMs !== undefined && policy.retryDelayMs > 0
            ? Math.floor(policy.retryDelayMs)
            : 0;

    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await runWithTimeout(operation, policy.timeoutMs);
        } catch (error) {
            lastError = error;
            const isLastAttempt = attempt === attempts - 1;
            if (isLastAttempt) {
                throw error;
            }

            if (delayMs > 0) {
                await sleep(delayMs);
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("AdminUserService query failed");
}

function createConcurrencyLimiter(limit: number | undefined): QueryExecutor {
    if (!Number.isFinite(limit) || limit === undefined || limit <= 0) {
        return directQueryExecutor;
    }

    let activeCount = 0;
    const queue: Array<() => void> = [];

    const scheduleNext = () => {
        if (activeCount >= limit) {
            return;
        }

        const nextTask = queue.shift();
        if (!nextTask) {
            return;
        }

        nextTask();
    };

    return async function runLimited<T>(
        operation: () => Promise<T>,
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const execute = () => {
                let taskPromise: Promise<T>;
                try {
                    taskPromise = Promise.resolve(operation());
                } catch (error) {
                    activeCount--;
                    scheduleNext();
                    reject(error);
                    return;
                }

                taskPromise.then(resolve, reject).finally(() => {
                    activeCount--;
                    scheduleNext();
                });
            };

            if (activeCount < limit) {
                activeCount++;
                execute();
            } else {
                queue.push(() => {
                    activeCount++;
                    execute();
                });
            }
        });
    };
}

interface QueryExecutorConfig extends QueryRetryPolicy {
    concurrency?: number;
}

function createQueryExecutor(config: QueryExecutorConfig): QueryExecutor {
    const limiter = createConcurrencyLimiter(config.concurrency);
    const policy: QueryRetryPolicy = {
        timeoutMs: config.timeoutMs,
        retryAttempts: Math.max(0, Math.floor(config.retryAttempts ?? 0)),
        retryDelayMs:
            config.retryDelayMs !== undefined && config.retryDelayMs >= 0
                ? Math.floor(config.retryDelayMs)
                : undefined,
    };

    return <T>(operation: () => Promise<T>) =>
        limiter(() => executeWithPolicies(operation, policy));
}

function normalizePositiveInteger(value: number | undefined) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
        return undefined;
    }

    return Math.floor(value);
}

function createDetailQueryExecutorFromConfig(
    detailQueryConfig:
        | {
              concurrency?: number;
              timeoutMs?: number;
              retry?: { attempts?: number; delayMs?: number };
          }
        | null
        | undefined,
): QueryExecutor {
    const concurrency = normalizePositiveInteger(
        detailQueryConfig?.concurrency,
    );
    const timeoutMs = normalizePositiveInteger(detailQueryConfig?.timeoutMs);
    const retryAttempts = normalizePositiveInteger(
        detailQueryConfig?.retry?.attempts,
    );
    const retryDelayMs = normalizePositiveInteger(
        detailQueryConfig?.retry?.delayMs,
    );

    if (
        concurrency === undefined &&
        timeoutMs === undefined &&
        (retryAttempts === undefined || retryAttempts === 0) &&
        retryDelayMs === undefined
    ) {
        return directQueryExecutor;
    }

    return createQueryExecutor({
        concurrency,
        timeoutMs,
        retryAttempts: retryAttempts ?? 0,
        retryDelayMs,
    });
}

const sharedDetailQueryExecutor = createDetailQueryExecutorFromConfig(
    config.admin?.users?.detailQuery,
);

async function fetchUserRow(db: DbClient, userId: string) {
    const [row] = await db
        .select({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            image: user.image,
            currentCredits: user.currentCredits,
            lastCreditRefreshAt: user.lastCreditRefreshAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    return row ?? null;
}

async function fetchCustomerBundle(
    db: DbClient,
    userId: string,
    runQuery: QueryExecutor = directQueryExecutor,
): Promise<CustomerBundle> {
    const [customerRow] = await runQuery(() =>
        db
            .select({
                id: customers.id,
                credits: customers.credits,
                createdAt: customers.createdAt,
                updatedAt: customers.updatedAt,
            })
            .from(customers)
            .where(eq(customers.userId, userId))
            .limit(1),
    );

    if (!customerRow) {
        return {
            customer: null,
            credits: [],
            subscriptions: [],
        };
    }

    const [creditRows, subscriptionRows] = await Promise.all([
        runQuery(() =>
            db
                .select({
                    id: creditsHistory.id,
                    amount: creditsHistory.amount,
                    type: creditsHistory.type,
                    description: creditsHistory.description,
                    createdAt: creditsHistory.createdAt,
                })
                .from(creditsHistory)
                .where(eq(creditsHistory.customerId, customerRow.id))
                .orderBy(desc(creditsHistory.createdAt))
                .limit(20),
        ),
        runQuery(() =>
            db
                .select({
                    id: subscriptionTable.id,
                    status: subscriptionTable.status,
                    currentPeriodStart: subscriptionTable.currentPeriodStart,
                    currentPeriodEnd: subscriptionTable.currentPeriodEnd,
                    canceledAt: subscriptionTable.canceledAt,
                    createdAt: subscriptionTable.createdAt,
                    updatedAt: subscriptionTable.updatedAt,
                })
                .from(subscriptionTable)
                .where(eq(subscriptionTable.customerId, customerRow.id))
                .orderBy(desc(subscriptionTable.createdAt))
                .limit(10),
        ),
    ]);

    return {
        customer: customerRow,
        credits: creditRows,
        subscriptions: subscriptionRows,
    };
}

function fetchUsageRows(db: DbClient, userId: string) {
    return db
        .select({
            id: usageDaily.id,
            date: usageDaily.date,
            feature: usageDaily.feature,
            totalAmount: usageDaily.totalAmount,
            unit: usageDaily.unit,
        })
        .from(usageDaily)
        .where(eq(usageDaily.userId, userId))
        .orderBy(desc(usageDaily.date))
        .limit(30);
}

function fetchTransactionRows(db: DbClient, userId: string) {
    return db
        .select({
            id: creditTransactions.id,
            amount: creditTransactions.amount,
            remainingAmount: creditTransactions.remainingAmount,
            type: creditTransactions.type,
            description: creditTransactions.description,
            expirationDate: creditTransactions.expirationDate,
            paymentIntentId: creditTransactions.paymentIntentId,
            createdAt: creditTransactions.createdAt,
        })
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(20);
}

interface AdminUserServiceDependencies {
    getDb: typeof getDb;
    resolveAdminEmails: () => Promise<Set<string>>;
    getCacheTtlSeconds: () => number;
    detailQueryExecutor?: QueryExecutor;
}

const defaultDependencies: AdminUserServiceDependencies = {
    getDb,
    resolveAdminEmails: resolveAdminEmailSet,
    getCacheTtlSeconds: () => config.cache.defaultTtlSeconds ?? 0,
    detailQueryExecutor: sharedDetailQueryExecutor,
};

export function createAdminUserService(
    dependencies: AdminUserServiceDependencies = defaultDependencies,
) {
    const listUsers = async (
        options: ListUsersOptions = {},
    ): Promise<ListUsersResult> => {
        const { page, perPage } = normalizePagination(options);
        const emailFilter = options.email?.trim() || undefined;
        const nameFilter = options.name?.trim() || undefined;

        const compute = async (): Promise<ListUsersResult> => {
            const db = await dependencies.getDb();
            const adminEmails = await dependencies.resolveAdminEmails();

            const {
                rows,
                total,
                page: resolvedPage,
                perPage: resolvedPerPage,
            } = await runPaginatedQuery({
                page,
                perPage,
                filters: [
                    emailFilter
                        ? like(user.email, `%${emailFilter}%`)
                        : undefined,
                    nameFilter ? like(user.name, `%${nameFilter}%`) : undefined,
                ],
                operator: "or",
                fetchRows: async ({ limit, offset, where }) => {
                    const baseQuery = db
                        .select({
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            emailVerified: user.emailVerified,
                            createdAt: user.createdAt,
                            currentCredits: user.currentCredits,
                        })
                        .from(user)
                        .orderBy(desc(user.createdAt))
                        .limit(limit)
                        .offset(offset);
                    return where
                        ? await baseQuery.where(where)
                        : await baseQuery;
                },
                fetchTotal: async (where) => {
                    const totalQuery = db
                        .select({ count: sql<number>`count(*)` })
                        .from(user)
                        .limit(1);
                    const result = where
                        ? await totalQuery.where(where)
                        : await totalQuery;
                    return result[0]?.count ?? 0;
                },
            });

            return {
                data: rows.map((row) => ({
                    id: row.id,
                    email: row.email,
                    name: row.name,
                    role: resolveRole(row.email, adminEmails),
                    status: resolveStatus(row.emailVerified),
                    createdAt: toNullableString(row.createdAt),
                    credits: row.currentCredits ?? 0,
                })),
                total,
                page: resolvedPage,
                perPage: resolvedPerPage,
            } satisfies ListUsersResult;
        };

        const ttlSeconds = dependencies.getCacheTtlSeconds();
        if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
            return compute();
        }

        const { value } = await computeWithAdminCache(
            {
                resource: "users",
                scope: "list",
                params: {
                    page,
                    perPage,
                    email: emailFilter ?? null,
                    name: nameFilter ?? null,
                },
            },
            { ttlSeconds },
            compute,
        );

        return value;
    };

    const getUserDetail = async (
        userId: string,
    ): Promise<AdminUserDetail | null> => {
        if (!userId) {
            return null;
        }

        const db = await dependencies.getDb();
        const runControlledQuery =
            dependencies.detailQueryExecutor ?? sharedDetailQueryExecutor;

        const userRow = await runControlledQuery(() =>
            fetchUserRow(db, userId),
        );
        if (!userRow) {
            return null;
        }

        const adminEmailsPromise = dependencies.resolveAdminEmails();

        const [customerBundle, usageRows, transactionRows, adminEmails] =
            await Promise.all([
                fetchCustomerBundle(db, userId, runControlledQuery),
                runControlledQuery(() => fetchUsageRows(db, userId)),
                runControlledQuery(() => fetchTransactionRows(db, userId)),
                adminEmailsPromise,
            ]);

        return {
            user: {
                id: userRow.id,
                email: userRow.email,
                name: userRow.name,
                emailVerified: Boolean(userRow.emailVerified),
                role: resolveRole(userRow.email, adminEmails),
                status: resolveStatus(userRow.emailVerified),
                createdAt: toNullableString(userRow.createdAt),
                updatedAt: toNullableString(userRow.updatedAt),
                image: userRow.image ?? null,
                currentCredits: userRow.currentCredits ?? 0,
                lastCreditRefreshAt: toNullableString(
                    userRow.lastCreditRefreshAt,
                ),
            },
            customer: customerBundle.customer
                ? {
                      id: customerBundle.customer.id,
                      credits: customerBundle.customer.credits,
                      createdAt: toNullableString(
                          customerBundle.customer.createdAt,
                      ),
                      updatedAt: toNullableString(
                          customerBundle.customer.updatedAt,
                      ),
                  }
                : null,
            subscriptions: customerBundle.subscriptions.map((subscription) => ({
                id: subscription.id,
                status: subscription.status,
                currentPeriodStart: toNullableString(
                    subscription.currentPeriodStart,
                ),
                currentPeriodEnd: toNullableString(
                    subscription.currentPeriodEnd,
                ),
                canceledAt: toNullableString(subscription.canceledAt),
                createdAt: toNullableString(subscription.createdAt),
                updatedAt: toNullableString(subscription.updatedAt),
            })),
            creditsHistory: customerBundle.credits.map((credit) => ({
                id: credit.id,
                amount: credit.amount,
                type: credit.type,
                description: credit.description,
                createdAt: toNullableString(credit.createdAt),
            })),
            usage: usageRows.map((usage) => ({
                id: usage.id,
                date: usage.date,
                feature: usage.feature,
                totalAmount: usage.totalAmount,
                unit: usage.unit,
            })),
            transactions: transactionRows.map(
                (transaction): AdminUserTransaction => ({
                    id: transaction.id,
                    amount: transaction.amount,
                    remainingAmount: transaction.remainingAmount,
                    type: transaction.type,
                    description: transaction.description,
                    expirationDate: toNullableString(
                        transaction.expirationDate,
                    ),
                    paymentIntentId: transaction.paymentIntentId ?? null,
                    createdAt: toNullableString(transaction.createdAt),
                }),
            ),
        } satisfies AdminUserDetail;
    };

    return { listUsers, getUserDetail } satisfies AdminUserService;
}

const defaultService = createAdminUserService();

export async function listUsers(
    options: ListUsersOptions = {},
): Promise<ListUsersResult> {
    return defaultService.listUsers(options);
}

export async function getUserDetail(
    userId: string,
): Promise<AdminUserDetail | null> {
    return defaultService.getUserDetail(userId);
}
