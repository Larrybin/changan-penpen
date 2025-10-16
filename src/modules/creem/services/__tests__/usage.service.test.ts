import { eq } from "drizzle-orm";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import * as dbModule from "@/db";
import { customers } from "@/modules/creem/schemas/billing.schema";
import { usageDaily, usageEvents } from "@/modules/creem/schemas/usage.schema";
import type { TestDbContext } from "../../../../../tests/fixtures/db";
import { createTestDb } from "../../../../../tests/fixtures/db";
import {
    CREDIT_TRANSACTION_TYPE,
    creditTransactions,
    user,
} from "@/db";
import { getUsageDaily, recordUsage } from "../usage.service";

describe("creem usage service", () => {
    let ctx: TestDbContext;
    let userId: string;
    let getDbSpy: ReturnType<typeof vi.spyOn> | undefined;
    let shouldSkip = false;

    const skipIfUnavailable = () => shouldSkip;

    beforeAll(async () => {
        try {
            ctx = await createTestDb();
            getDbSpy = vi
                .spyOn(dbModule, "getDb")
                .mockImplementation(
                    async () =>
                        ctx.db as unknown as Awaited<
                            ReturnType<typeof dbModule.getDb>
                        >,
                );
        } catch (error) {
            shouldSkip = true;
            console.warn(
                "Skipping creem usage service tests because better-sqlite3 bindings are unavailable:",
                (error as Error).message,
            );
        }
    });

    beforeEach(() => {
        if (skipIfUnavailable()) {
            return;
        }

        ctx.reset();
        const user = ctx.insertUser({
            id: "usage-user",
            email: "usage-user@example.com",
            name: "Usage User",
        });
        userId = user.id;
        getDbSpy?.mockClear();
        getDbSpy?.mockImplementation(
            async () =>
                ctx.db as unknown as Awaited<ReturnType<typeof dbModule.getDb>>,
        );
    });

    afterAll(() => {
        if (getDbSpy) {
            getDbSpy.mockRestore();
        }
        if (!shouldSkip) {
            ctx.cleanup();
        }
    });

    it("records usage events and aggregates them daily", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-03-01T10:00:00.000Z"));

        const result = await recordUsage({
            userId,
            feature: "ai.generate",
            amount: 10,
            unit: "tokens",
        });

        expect(result).toEqual({
            ok: true,
            date: "2024-03-01",
            newCredits: undefined,
        });

        const events = ctx.db.select().from(usageEvents).all();
        expect(events).toHaveLength(1);
        expect(events[0]?.feature).toBe("ai.generate");

        const dailyRows = ctx.db.select().from(usageDaily).all();
        expect(dailyRows).toHaveLength(1);
        expect(dailyRows[0]?.totalAmount).toBe(10);

        vi.setSystemTime(new Date("2024-03-01T12:00:00.000Z"));
        await recordUsage({
            userId,
            feature: "ai.generate",
            amount: 5,
            unit: "tokens",
        });

        const updatedDaily = ctx.db.select().from(usageDaily).all();
        expect(updatedDaily[0]?.totalAmount).toBe(15);

        vi.useRealTimers();
    });

    it("rejects non-positive amounts", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        await expect(
            recordUsage({
                userId,
                feature: "ai.generate",
                amount: 0,
                unit: "tokens",
            }),
        ).rejects.toThrow("Usage amount must be a positive number");

        await expect(
            recordUsage({
                userId,
                feature: "ai.generate",
                amount: -5,
                unit: "tokens",
            }),
        ).rejects.toThrow("Usage amount must be a positive number");
    });

    it("consumes credits through the billing ledger when requested", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const now = new Date();

        ctx.db
            .update(user)
            .set({ currentCredits: 120, updatedAt: now })
            .where(eq(user.id, userId))
            .run();

        ctx.db
            .insert(customers)
            .values({
                userId,
                creemCustomerId: "creem-user",
                email: "usage@example.com",
                name: "Usage",
                country: "US",
                credits: 120,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
            })
            .run();

        ctx.db
            .insert(creditTransactions)
            .values({
                userId,
                amount: 120,
                remainingAmount: 120,
                type: CREDIT_TRANSACTION_TYPE.PURCHASE,
                description: "Initial top up",
                createdAt: now,
                updatedAt: now,
            })
            .run();

        const result = await recordUsage({
            userId,
            feature: "storage.upload",
            amount: 1,
            unit: "files",
            consumeCredits: 20,
        });

        expect(result.newCredits).toBe(100);

        const transactions = ctx.db
            .select()
            .from(creditTransactions)
            .orderBy(creditTransactions.createdAt)
            .all();

        expect(transactions).toHaveLength(2);
        expect(
            transactions.some(
                (txn) =>
                    txn.type === CREDIT_TRANSACTION_TYPE.USAGE &&
                    txn.amount === -20 &&
                    txn.description.includes("Usage: storage.upload"),
            ),
        ).toBe(true);

        const purchaseTxn = transactions.find(
            (txn) => txn.type === CREDIT_TRANSACTION_TYPE.PURCHASE,
        );
        expect(purchaseTxn?.remainingAmount).toBe(100);

        const stored = ctx.db
            .select({ credits: customers.credits })
            .from(customers)
            .where(eq(customers.userId, userId))
            .get();
        expect(stored?.credits).toBe(100);
    });

    it("throws when consuming more credits than available", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const now = new Date();

        ctx.db
            .update(user)
            .set({ currentCredits: 5, updatedAt: now })
            .where(eq(user.id, userId))
            .run();

        ctx.db
            .insert(creditTransactions)
            .values({
                userId,
                amount: 5,
                remainingAmount: 5,
                type: CREDIT_TRANSACTION_TYPE.PURCHASE,
                description: "Initial",
                createdAt: now,
                updatedAt: now,
            })
            .run();

        await expect(
            recordUsage({
                userId,
                feature: "storage.upload",
                amount: 1,
                unit: "files",
                consumeCredits: 10,
            }),
        ).rejects.toThrow("Insufficient credits");

        const transactions = ctx.db
            .select()
            .from(creditTransactions)
            .orderBy(creditTransactions.createdAt)
            .all();
        expect(transactions).toHaveLength(1);
        expect(transactions[0]?.remainingAmount).toBe(5);
    });

    it("retrieves usage daily records within the requested range", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-04-10T08:00:00.000Z"));
        await recordUsage({
            userId,
            feature: "ai.generate",
            amount: 5,
            unit: "tokens",
        });
        vi.setSystemTime(new Date("2024-04-11T08:00:00.000Z"));
        await recordUsage({
            userId,
            feature: "ai.generate",
            amount: 7,
            unit: "tokens",
        });
        vi.setSystemTime(new Date("2024-04-12T08:00:00.000Z"));
        await recordUsage({
            userId,
            feature: "ai.generate",
            amount: 3,
            unit: "tokens",
        });

        const rows = await getUsageDaily(userId, "2024-04-10", "2024-04-11");
        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.totalAmount)).toEqual([5, 7]);

        vi.useRealTimers();
    });
});
