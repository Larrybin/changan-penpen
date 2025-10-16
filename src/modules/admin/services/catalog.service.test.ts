import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    createContentPage,
    createCoupon,
    createProduct,
    deleteContentPage,
    deleteCoupon,
    deleteProduct,
    updateContentPage,
    updateCoupon,
    updateProduct,
} from "./catalog.service";

const { tables } = vi.hoisted(() => ({
    tables: {
        products: { id: Symbol("products.id") },
        coupons: { id: Symbol("coupons.id") },
        contentPages: { id: Symbol("contentPages.id") },
    },
}));

type TableKey = "products" | "coupons" | "contentPages";

const { dbState } = vi.hoisted(() => ({
    dbState: {
        records: {
            products: [] as Array<Record<string, unknown>>,
            coupons: [] as Array<Record<string, unknown>>,
            contentPages: [] as Array<Record<string, unknown>>,
        },
        nextId: {
            products: 1,
            coupons: 1,
            contentPages: 1,
        } satisfies Record<TableKey, number>,
    },
}));

const { recordAdminAuditLogMock } = vi.hoisted(() => ({
    recordAdminAuditLogMock: vi.fn(),
}));

const resolveTableKey = (table: unknown): TableKey => {
    if (table === tables.products) {
        return "products";
    }
    if (table === tables.coupons) {
        return "coupons";
    }
    if (table === tables.contentPages) {
        return "contentPages";
    }
    throw new Error("Unknown table");
};

vi.mock("drizzle-orm", () => ({
    eq: (_column: unknown, value: number) => ({ value }),
}));

vi.mock("@/db", () => ({
    getDb: vi.fn(async () => ({
        insert: (table: unknown) => ({
            values: (values: Record<string, unknown>) => ({
                returning: async () => {
                    const key = resolveTableKey(table);
                    const row = {
                        id: dbState.nextId[key]++,
                        ...values,
                    };
                    dbState.records[key].push(row);
                    return [row];
                },
            }),
        }),
        update: (table: unknown) => ({
            set: (values: Record<string, unknown>) => ({
                where: (condition: { value: number }) => ({
                    returning: async () => {
                        const key = resolveTableKey(table);
                        const row = dbState.records[key].find(
                            (item) => item.id === condition.value,
                        );
                        if (!row) {
                            throw new Error(`Row ${condition.value} not found`);
                        }
                        Object.assign(row, values);
                        return [row];
                    },
                }),
            }),
        }),
        delete: (table: unknown) => ({
            where: (condition: { value: number }) => {
                const key = resolveTableKey(table);
                dbState.records[key] = dbState.records[key].filter(
                    (item) => item.id !== condition.value,
                );
            },
        }),
        select: () => ({
            from: (table: unknown) => ({
                orderBy: async () => {
                    const key = resolveTableKey(table);
                    return [...dbState.records[key]];
                },
                where: (condition: { value: number }) => ({
                    limit: async () => {
                        const key = resolveTableKey(table);
                        const row = dbState.records[key].find(
                            (item) => item.id === condition.value,
                        );
                        return row ? [row] : [];
                    },
                }),
            }),
        }),
    })),
    products: tables.products,
    coupons: tables.coupons,
    contentPages: tables.contentPages,
}));

vi.mock("@/modules/admin/services/system-audit.service", () => ({
    recordAdminAuditLog: recordAdminAuditLogMock,
}));

const resetDbState = () => {
    dbState.records.products = [];
    dbState.records.coupons = [];
    dbState.records.contentPages = [];
    dbState.nextId.products = 1;
    dbState.nextId.coupons = 1;
    dbState.nextId.contentPages = 1;
};

const adminEmail = "admin@example.com";

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    vi.clearAllMocks();
    resetDbState();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("Product CRUD helpers", () => {
    it("creates products with defaults and audit log", async () => {
        const product = await createProduct(
            {
                slug: "pro-plan",
                name: "Pro Plan",
            },
            adminEmail,
        );

        expect(product).toMatchObject({
            id: 1,
            slug: "pro-plan",
            name: "Pro Plan",
            description: "",
            priceCents: 0,
            currency: "USD",
            type: "one_time",
            status: "draft",
            metadata: "",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
        });
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "create_product",
            targetType: "product",
            targetId: "1",
            metadata: JSON.stringify({
                slug: "pro-plan",
                name: "Pro Plan",
            }),
        });
    });

    it("updates products using shared defaults", async () => {
        const created = await createProduct(
            {
                slug: "starter",
                name: "Starter",
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        vi.setSystemTime(new Date("2024-01-02T00:00:00.000Z"));

        const updated = await updateProduct(
            created.id as number,
            {
                slug: "starter",
                name: "Starter Updated",
            },
            adminEmail,
        );

        expect(updated).toMatchObject({
            id: created.id,
            description: "",
            priceCents: 0,
            currency: "USD",
            type: "one_time",
            status: "draft",
            metadata: "",
            updatedAt: "2024-01-02T00:00:00.000Z",
        });
        expect(updated.createdAt).toBe("2024-01-01T00:00:00.000Z");
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "update_product",
            targetType: "product",
            targetId: `${created.id}`,
            metadata: JSON.stringify({
                slug: "starter",
                name: "Starter Updated",
            }),
        });
    });

    it("deletes products and records audit entry", async () => {
        const created = await createProduct(
            {
                slug: "enterprise",
                name: "Enterprise",
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        await deleteProduct(created.id as number, adminEmail);

        expect(dbState.records.products).toHaveLength(0);
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "delete_product",
            targetType: "product",
            targetId: `${created.id}`,
        });
    });
});

describe("Coupon CRUD helpers", () => {
    it("creates coupons with defaults and redeemed count", async () => {
        const coupon = await createCoupon(
            {
                code: "NEWYEAR",
            },
            adminEmail,
        );

        expect(coupon).toMatchObject({
            id: 1,
            code: "NEWYEAR",
            description: "",
            discountType: "percentage",
            discountValue: 0,
            maxRedemptions: null,
            redeemedCount: 0,
            startsAt: null,
            endsAt: null,
            status: "inactive",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
        });
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "create_coupon",
            targetType: "coupon",
            targetId: "1",
            metadata: JSON.stringify({ code: "NEWYEAR" }),
        });
    });

    it("updates coupons while preserving defaults", async () => {
        const created = await createCoupon(
            {
                code: "SAVE20",
                discountValue: 20,
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        vi.setSystemTime(new Date("2024-01-03T00:00:00.000Z"));

        const updated = await updateCoupon(
            created.id as number,
            {
                code: "SAVE20",
                discountValue: 25,
            },
            adminEmail,
        );

        expect(updated).toMatchObject({
            id: created.id,
            description: "",
            discountType: "percentage",
            discountValue: 25,
            maxRedemptions: null,
            startsAt: null,
            endsAt: null,
            status: "inactive",
            updatedAt: "2024-01-03T00:00:00.000Z",
        });
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "update_coupon",
            targetType: "coupon",
            targetId: `${created.id}`,
            metadata: JSON.stringify({
                code: "SAVE20",
                discountValue: 25,
            }),
        });
    });

    it("deletes coupons and logs audit", async () => {
        const created = await createCoupon(
            {
                code: "DELETE",
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        await deleteCoupon(created.id as number, adminEmail);

        expect(dbState.records.coupons).toHaveLength(0);
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "delete_coupon",
            targetType: "coupon",
            targetId: `${created.id}`,
        });
    });
});

describe("Content page CRUD helpers", () => {
    it("creates content pages with defaults", async () => {
        const page = await createContentPage(
            {
                title: "About",
                slug: "about",
            },
            adminEmail,
        );

        expect(page).toMatchObject({
            id: 1,
            title: "About",
            slug: "about",
            summary: "",
            language: "en",
            status: "draft",
            content: "",
            publishedAt: null,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
        });
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "create_content_page",
            targetType: "content_page",
            targetId: "1",
            metadata: JSON.stringify({
                title: "About",
                slug: "about",
            }),
        });
    });

    it("updates content pages with shared defaults", async () => {
        const created = await createContentPage(
            {
                title: "Docs",
                slug: "docs",
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        vi.setSystemTime(new Date("2024-01-04T00:00:00.000Z"));

        const updated = await updateContentPage(
            created.id as number,
            {
                title: "Docs",
                slug: "docs",
                content: "Updated",
            },
            adminEmail,
        );

        expect(updated).toMatchObject({
            id: created.id,
            summary: "",
            language: "en",
            status: "draft",
            content: "Updated",
            publishedAt: null,
            updatedAt: "2024-01-04T00:00:00.000Z",
        });
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "update_content_page",
            targetType: "content_page",
            targetId: `${created.id}`,
            metadata: JSON.stringify({
                title: "Docs",
                slug: "docs",
                content: "Updated",
            }),
        });
    });

    it("deletes content pages and records audit", async () => {
        const created = await createContentPage(
            {
                title: "Legal",
                slug: "legal",
            },
            adminEmail,
        );
        recordAdminAuditLogMock.mockClear();

        await deleteContentPage(created.id as number, adminEmail);

        expect(dbState.records.contentPages).toHaveLength(0);
        expect(recordAdminAuditLogMock).toHaveBeenCalledWith({
            adminEmail,
            action: "delete_content_page",
            targetType: "content_page",
            targetId: `${created.id}`,
        });
    });
});
