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
import { normalizePagination } from "@/modules/admin/utils/pagination";

export interface ListReportsOptions {
    page?: number;
    perPage?: number;
}

export async function listReports(options: ListReportsOptions = {}) {
    const db = await getDb();
    const { page: normalizedPage, perPage: normalizedPerPage } =
        normalizePagination(options);
    const page = Math.max(normalizedPage, 1);
    const perPage = Math.min(Math.max(normalizedPerPage, 1), 100);
    const offset = (page - 1) * perPage;

    const [rows, totalRows] = await Promise.all([
        db
            .select()
            .from(reports)
            .orderBy(desc(reports.createdAt))
            .limit(perPage)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(reports),
    ]);

    return {
        data: rows,
        total: totalRows[0]?.count ?? 0,
    };
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

    const data = await generateReportData(input);
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

async function generateReportData(input: CreateReportInput) {
    switch (input.type) {
        case "orders":
            return generateOrdersReport(input);
        case "usage":
            return generateUsageReport(input);
        default:
            return generateCreditsReport(input);
    }
}

async function generateOrdersReport(input: CreateReportInput) {
    const db = await getDb();
    const query = db
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
        .orderBy(desc(orders.createdAt));

    const rows = input.tenantId
        ? await query.where(eq(customers.userId, input.tenantId))
        : await query;

    return {
        headers: ["ID", "Email", "Amount", "Currency", "Status", "Created At"],
        rows: rows.map((row) => [
            row.id,
            row.customerEmail ?? "",
            (row.amountCents ?? 0) / 100,
            row.currency ?? "USD",
            row.status ?? "",
            row.createdAt ?? "",
        ]),
    };
}

async function generateUsageReport(input: CreateReportInput) {
    const db = await getDb();
    const query = db
        .select({
            userId: usageDaily.userId,
            date: usageDaily.date,
            totalAmount: usageDaily.totalAmount,
            unit: usageDaily.unit,
        })
        .from(usageDaily)
        .orderBy(desc(usageDaily.date));

    const rows = input.tenantId
        ? await query.where(eq(usageDaily.userId, input.tenantId))
        : await query;

    return {
        headers: ["User ID", "Date", "Amount", "Unit"],
        rows: rows.map((row) => [
            row.userId,
            row.date,
            row.totalAmount,
            row.unit ?? "",
        ]),
    };
}

async function generateCreditsReport(input: CreateReportInput) {
    const db = await getDb();
    const query = db
        .select({
            id: creditsHistory.id,
            amount: creditsHistory.amount,
            type: creditsHistory.type,
            createdAt: creditsHistory.createdAt,
            customerEmail: customers.email,
        })
        .from(creditsHistory)
        .innerJoin(customers, eq(customers.id, creditsHistory.customerId))
        .orderBy(desc(creditsHistory.createdAt));

    const rows = input.tenantId
        ? await query.where(eq(customers.userId, input.tenantId))
        : await query;

    return {
        headers: ["ID", "Email", "Amount", "Type", "Created At"],
        rows: rows.map((row) => [
            row.id,
            row.customerEmail ?? "",
            row.amount ?? 0,
            row.type ?? "",
            row.createdAt ?? "",
        ]),
    };
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
