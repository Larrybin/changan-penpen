import { desc, eq, sql } from "drizzle-orm";

import {
    creditsHistory,
    customers,
    getDb,
    orders,
    reports,
    usageDaily,
} from "@/db";
import { recordAdminAuditLog } from "@/modules/admin/services/system-audit.service";
import {
    createSimplePaginatedList,
    type FilterableBuilder,
} from "@/modules/admin/utils/query-factory";

export interface ListReportsOptions {
    page?: number;
    perPage?: number;
}

const runReportListQuery = createSimplePaginatedList({
    buildBaseQuery: async (db, { limit, offset }) =>
        db
            .select()
            .from(reports)
            .orderBy(desc(reports.createdAt))
            .limit(limit)
            .offset(offset),
    buildTotalQuery: async (db) =>
        db.select({ count: sql<number>`count(*)` }).from(reports),
});

export async function listReports(options: ListReportsOptions = {}) {
    return await runReportListQuery(options);
}

export interface CreateReportInput {
    type: "orders" | "usage" | "credits";
    tenantId?: string;
    from?: string;
    to?: string;
}

export async function createReport(
    input: CreateReportInput,
    adminEmail: string,
) {
    const db = await getDb();
    const timestamp = new Date().toISOString();

    const data = await generateReportData(db, input);
    const csv = toCsv(data.headers, data.rows);
    const downloadUrl = `data:text/csv;base64,${toBase64(csv)}`;

    const [created] = await db
        .insert(reports)
        .values({
            type: input.type,
            parameters: JSON.stringify(input),
            status: "completed",
            downloadUrl,
            createdAt: timestamp,
            completedAt: timestamp,
        })
        .returning();

    await recordAdminAuditLog({
        adminEmail,
        action: "generate_report",
        targetType: "report",
        targetId: `${created.id}`,
        metadata: JSON.stringify(input),
    });

    return created;
}

type DbClient = Awaited<ReturnType<typeof getDb>>;

interface TabularReportConfig<TRow> {
    headers: string[];
    buildBaseQuery: (db: DbClient) => FilterableBuilder<TRow[]>;
    applyTenantFilter?: (
        query: FilterableBuilder<TRow[]>,
        tenantId: string,
    ) => FilterableBuilder<TRow[]>;
    mapRow: (row: TRow) => Array<string | number | null>;
}

function withWhere<TRow>(
    query: FilterableBuilder<TRow[]>,
    apply: (query: {
        where: (...args: unknown[]) => FilterableBuilder<TRow[]>;
    }) => FilterableBuilder<TRow[]>,
) {
    return apply(
        query as unknown as {
            where: (...args: unknown[]) => FilterableBuilder<TRow[]>;
        },
    );
}

async function generateTabularReport<TRow>(
    db: DbClient,
    input: CreateReportInput,
    config: TabularReportConfig<TRow>,
) {
    const baseQuery = config.buildBaseQuery(db);
    const query =
        input.tenantId && config.applyTenantFilter
            ? config.applyTenantFilter(baseQuery, input.tenantId)
            : baseQuery;
    const rows = await query;

    return {
        headers: config.headers,
        rows: rows.map(config.mapRow),
    };
}

async function generateReportData(db: DbClient, input: CreateReportInput) {
    switch (input.type) {
        case "orders":
            return generateOrdersReport(db, input);
        case "usage":
            return generateUsageReport(db, input);
        default:
            return generateCreditsReport(db, input);
    }
}

async function generateOrdersReport(db: DbClient, input: CreateReportInput) {
    return await generateTabularReport(db, input, {
        headers: ["ID", "Email", "Amount", "Currency", "Status", "Created At"],
        buildBaseQuery: (client) =>
            client
                .select({
                    id: orders.id,
                    amountCents: orders.amountCents,
                    currency: orders.currency,
                    createdAt: orders.createdAt,
                    customerEmail: customers.email,
                    status: orders.status,
                })
                .from(orders)
                .innerJoin(customers, eq(customers.id, orders.customerId))
                .orderBy(desc(orders.createdAt)),
        applyTenantFilter: (query, tenantId) =>
            withWhere(query, (builder) =>
                builder.where(eq(customers.userId, tenantId)),
            ),
        mapRow: (row) => [
            row.id,
            row.customerEmail ?? "",
            (row.amountCents ?? 0) / 100,
            row.currency ?? "USD",
            row.status ?? "",
            row.createdAt ?? "",
        ],
    });
}

async function generateUsageReport(db: DbClient, input: CreateReportInput) {
    return await generateTabularReport(db, input, {
        headers: ["User ID", "Date", "Amount", "Unit"],
        buildBaseQuery: (client) =>
            client
                .select({
                    userId: usageDaily.userId,
                    date: usageDaily.date,
                    totalAmount: usageDaily.totalAmount,
                    unit: usageDaily.unit,
                })
                .from(usageDaily)
                .orderBy(desc(usageDaily.date)),
        applyTenantFilter: (query, tenantId) =>
            withWhere(query, (builder) =>
                builder.where(eq(usageDaily.userId, tenantId)),
            ),
        mapRow: (row) => [
            row.userId,
            row.date,
            row.totalAmount,
            row.unit ?? "",
        ],
    });
}

async function generateCreditsReport(db: DbClient, input: CreateReportInput) {
    return await generateTabularReport(db, input, {
        headers: ["ID", "Email", "Amount", "Type", "Created At"],
        buildBaseQuery: (client) =>
            client
                .select({
                    id: creditsHistory.id,
                    amount: creditsHistory.amount,
                    type: creditsHistory.type,
                    createdAt: creditsHistory.createdAt,
                    customerEmail: customers.email,
                })
                .from(creditsHistory)
                .innerJoin(
                    customers,
                    eq(customers.id, creditsHistory.customerId),
                )
                .orderBy(desc(creditsHistory.createdAt)),
        applyTenantFilter: (query, tenantId) =>
            withWhere(query, (builder) =>
                builder.where(eq(customers.userId, tenantId)),
            ),
        mapRow: (row) => [
            row.id,
            row.customerEmail ?? "",
            row.amount ?? 0,
            row.type ?? "",
            row.createdAt ?? "",
        ],
    });
}

function toCsv(headers: string[], rows: Array<Array<string | number | null>>) {
    const escapeCsvValue = (value: string | number | null) => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes(",") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvRows = [headers.join(",")];
    for (const row of rows) {
        csvRows.push(row.map(escapeCsvValue).join(","));
    }
    return csvRows.join("\n");
}

function toBase64(data: string) {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(data).toString("base64");
    }
    if (typeof btoa !== "undefined" && typeof TextEncoder !== "undefined") {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        let binary = "";
        encoded.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }
    throw new Error("Base64 encoding is not supported in this environment");
}
