import { desc, eq, like } from "drizzle-orm";

import { config } from "@/config";
import {
    creditTransactions,
    getDb,
    user,
} from "@/db";
import { toNullableIsoString } from "@/lib/formatters";
import { getAdminAccessConfig } from "@/modules/admin/utils/admin-access";
import { computeWithAdminCache } from "@/modules/admin/utils/cache";
import { runUserDirectoryQuery } from "@/modules/admin/utils/query-factory";
import {
    fetchCustomerWithHistory,
    fetchUsageHistory,
    fetchUserCore,
    normalizePagination,
    type QueryRunner,
} from "@/modules/admin-shared";
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

type QueryExecutor = QueryRunner;

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
            } = await runUserDirectoryQuery({
                db,
                page,
                perPage,
                filters: [
                    emailFilter
                        ? like(user.email, `%${emailFilter}%`)
                        : undefined,
                    nameFilter ? like(user.name, `%${nameFilter}%`) : undefined,
                ],
                operator: "or",
                buildBaseQuery: async (client, { limit, offset, where }) => {
                    const query = client
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
                    return where ? await query.where(where) : await query;
                },
            });

            return {
                data: rows.map((row) => ({
                    id: row.id,
                    email: row.email,
                    name: row.name,
                    role: resolveRole(row.email, adminEmails),
                    status: resolveStatus(row.emailVerified),
                    createdAt: toNullableIsoString(row.createdAt),
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

        const userRow = await fetchUserCore(db, userId, runControlledQuery);
        if (!userRow) {
            return null;
        }

        const adminEmailsPromise = dependencies.resolveAdminEmails();

        const [customerHistory, usageRows, transactionRows, adminEmails] =
            await Promise.all([
                fetchCustomerWithHistory(db, userId, {
                    runQuery: runControlledQuery,
                }),
                fetchUsageHistory(db, userId, {
                    runQuery: runControlledQuery,
                }),
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
                status: resolveStatus(Boolean(userRow.emailVerified)),
                createdAt: toNullableIsoString(userRow.createdAt),
                updatedAt: toNullableIsoString(userRow.updatedAt),
                image: userRow.image ?? null,
                currentCredits: userRow.currentCredits ?? 0,
                lastCreditRefreshAt: toNullableIsoString(
                    userRow.lastCreditRefreshAt,
                ),
            },
            customer: customerHistory.customer
                ? {
                      id: customerHistory.customer.id,
                      credits: customerHistory.customer.credits,
                      createdAt: toNullableIsoString(
                          customerHistory.customer.createdAt,
                      ),
                      updatedAt: toNullableIsoString(
                          customerHistory.customer.updatedAt,
                      ),
                  }
                : null,
            subscriptions: customerHistory.subscriptions.map((subscription) => ({
                id: subscription.id,
                status: subscription.status,
                currentPeriodStart: toNullableIsoString(
                    subscription.currentPeriodStart,
                ),
                currentPeriodEnd: toNullableIsoString(
                    subscription.currentPeriodEnd,
                ),
                canceledAt: toNullableIsoString(subscription.canceledAt),
                createdAt: toNullableIsoString(subscription.createdAt),
                updatedAt: toNullableIsoString(subscription.updatedAt),
            })),
            creditsHistory: customerHistory.credits.map((credit) => ({
                id: credit.id,
                amount: credit.amount,
                type: credit.type,
                description: credit.description,
                createdAt: toNullableIsoString(credit.createdAt),
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
                    expirationDate: toNullableIsoString(
                        transaction.expirationDate,
                    ),
                    paymentIntentId: transaction.paymentIntentId ?? null,
                    createdAt: toNullableIsoString(transaction.createdAt),
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
