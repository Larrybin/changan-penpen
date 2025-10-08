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
import { decrementCredits, getUsageDaily, recordUsage } from "../usage.service";

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

    it("decrements credits when requested", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        const now = new Date().toISOString();
        ctx.db
            .insert(customers)
            .values({
                userId,
                creemCustomerId: "creem-user",
                email: "usage@example.com",
                name: "Usage",
                country: "US",
                credits: 120,
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

        const stored = ctx.db
            .select({ credits: customers.credits })
            .from(customers)
            .where(eq(customers.userId, userId))
            .get();
        expect(stored?.credits).toBe(100);
    });

    it("throws when decrementing credits for missing customer", async () => {
        if (skipIfUnavailable()) {
            return;
        }

        await expect(decrementCredits(userId, 10)).rejects.toThrow(
            "Customer not found for user",
        );
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
