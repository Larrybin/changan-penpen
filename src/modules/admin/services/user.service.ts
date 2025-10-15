import { desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
    creditsHistory,
    customers,
    getDb,
    subscriptions,
    usageDaily,
    user,
} from "@/db";
import type {
    AdminUserDetail,
    AdminUserListItem,
    AdminUserRole,
} from "@/modules/admin/users/models";
import { getAdminAccessConfig } from "@/modules/admin/utils/admin-access";
import { normalizePagination } from "@/modules/admin/utils/pagination";

export interface ListUsersOptions {
    page?: number;
    perPage?: number;
    email?: string;
    name?: string;
}

export interface ListUsersResult {
    data: AdminUserListItem[];
    total: number;
    page: number;
    perPage: number;
}

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

const getAdminEmailSet = async () => {
    const { allowedEmails } = await getAdminAccessConfig();
    return new Set(allowedEmails.map((email) => email.toLowerCase()));
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

export async function listUsers(
    options: ListUsersOptions = {},
): Promise<ListUsersResult> {
    const db = await getDb();
    const adminEmails = await getAdminEmailSet();
    const { page, perPage } = normalizePagination(options, {
        page: 1,
        perPage: 20,
    });
    const offset = (page - 1) * perPage;

    const filters = [];

    if (options.email) {
        filters.push(like(user.email, `%${options.email}%`));
    }

    if (options.name) {
        filters.push(like(user.name, `%${options.name}%`));
    }

    const whereClause =
        filters.length === 0
            ? undefined
            : filters.length === 1
              ? filters[0]
              : or(...filters);

    const listQuery = db
        .select({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(perPage)
        .offset(offset);

    const userRows = whereClause
        ? await listQuery.where(whereClause)
        : await listQuery;

    const totalQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .limit(1);
    const totalRows = whereClause
        ? await totalQuery.where(whereClause)
        : await totalQuery;
    const total = totalRows[0]?.count ?? 0;

    const userIds = userRows.map((row) => row.id);
    const customerRows = userIds.length
        ? await db
              .select({
                  userId: customers.userId,
                  credits: customers.credits,
              })
              .from(customers)
              .where(inArray(customers.userId, userIds))
        : [];

    const customerMap = new Map(
        customerRows.map((row) => [row.userId, row.credits]),
    );

    return {
        data: userRows.map((row) => ({
            id: row.id,
            email: row.email,
            name: row.name,
            role: resolveRole(row.email, adminEmails),
            status: resolveStatus(row.emailVerified),
            createdAt: toNullableString(row.createdAt),
            credits: customerMap.get(row.id) ?? null,
        })),
        total,
        page,
        perPage,
    };
}

export async function getUserDetail(
    userId: string,
): Promise<AdminUserDetail | null> {
    if (!userId) {
        return null;
    }

    const db = await getDb();
    const adminEmails = await getAdminEmailSet();

    const [userRow] = await db
        .select({
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            image: user.image,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    if (!userRow) {
        return null;
    }

    const [customerRow] = await db
        .select({
            id: customers.id,
            credits: customers.credits,
            createdAt: customers.createdAt,
            updatedAt: customers.updatedAt,
        })
        .from(customers)
        .where(eq(customers.userId, userId))
        .limit(1);

    const credits = customerRow
        ? await db
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
              .limit(20)
        : [];

    const subscriptionsRows = customerRow
        ? await db
              .select({
                  id: subscriptions.id,
                  status: subscriptions.status,
                  currentPeriodStart: subscriptions.currentPeriodStart,
                  currentPeriodEnd: subscriptions.currentPeriodEnd,
                  canceledAt: subscriptions.canceledAt,
                  createdAt: subscriptions.createdAt,
                  updatedAt: subscriptions.updatedAt,
              })
              .from(subscriptions)
              .where(eq(subscriptions.customerId, customerRow.id))
              .orderBy(desc(subscriptions.createdAt))
              .limit(10)
        : [];

    const usageRows = await db
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
        },
        customer: customerRow
            ? {
                  id: customerRow.id,
                  credits: customerRow.credits,
                  createdAt: toNullableString(customerRow.createdAt),
                  updatedAt: toNullableString(customerRow.updatedAt),
              }
            : null,
        subscriptions: subscriptionsRows.map((subscription) => ({
            id: subscription.id,
            status: subscription.status,
            currentPeriodStart: toNullableString(
                subscription.currentPeriodStart,
            ),
            currentPeriodEnd: toNullableString(subscription.currentPeriodEnd),
            canceledAt: toNullableString(subscription.canceledAt),
            createdAt: toNullableString(subscription.createdAt),
            updatedAt: toNullableString(subscription.updatedAt),
        })),
        creditsHistory: credits.map((credit) => ({
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
    };
}
